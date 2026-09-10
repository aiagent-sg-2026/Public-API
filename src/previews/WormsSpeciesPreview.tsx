import { CardEmpty, CardHeading, Facts, finite, numericText, rows, text } from './cardPrimitives'
import { cleanText } from './previewData'

type WormsTaxon = {
  aphiaId?: number
  scientificName: string
  authority?: string
  status?: string
  rank?: string
  validAphiaId?: number
  validName?: string
  validAuthority?: string
  unacceptReason?: string
  lsid?: string
  lineage: string[]
  isMarine?: number
  isBrackish?: number
  isFreshwater?: number
  isTerrestrial?: number
  isExtinct?: number
  modified?: string
}

const taxonModel = (value: unknown): WormsTaxon | undefined => {
  const row = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const scientificName = cleanText(row.scientificname)
  if (!scientificName) return undefined
  return {
    aphiaId: finite(row.AphiaID), scientificName, authority: text(row.authority), status: text(row.status), rank: text(row.rank),
    validAphiaId: finite(row.valid_AphiaID), validName: cleanText(row.valid_name), validAuthority: text(row.valid_authority),
    unacceptReason: cleanText(row.unacceptreason), lsid: text(row.lsid), modified: text(row.modified),
    lineage: ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'].map((key) => cleanText(row[key])).filter((value): value is string => Boolean(value)),
    isMarine: finite(row.isMarine), isBrackish: finite(row.isBrackish), isFreshwater: finite(row.isFreshwater), isTerrestrial: finite(row.isTerrestrial), isExtinct: finite(row.isExtinct),
  }
}

const requestedName = (requestUrl?: string) => {
  if (!requestUrl) return undefined
  try {
    const match = new URL(requestUrl).pathname.match(/\/AphiaRecordsByName\/(.+)$/)
    return match ? decodeURIComponent(match[1]) : undefined
  } catch { return undefined }
}
const yesNoUnknown = (value?: number) => value === undefined ? 'Not supplied' : value === 1 ? 'Yes' : value === 0 ? 'No' : numericText(value)

export function WormsSpeciesPreview({ data, requestUrl }: { data: unknown; requestUrl?: string }) {
  const taxa = rows(data).map(taxonModel).filter((taxon): taxon is WormsTaxon => Boolean(taxon))
  if (!taxa.length) return <CardEmpty domain="marine-taxonomy" title="No WoRMS taxon match returned" detail="WoRMS returned no usable AphiaRecord for this scientific name." state="empty"/>
  const first = taxa[0]
  const requested = requestedName(requestUrl)
  return <div className="domain-card worms-species-preview" data-domain-card="marine-taxonomy" data-result-state="ready" data-requested-scientific-name={requested} data-match-count={taxa.length} data-primary-aphia-id={first.aphiaId} data-primary-status={first.status} data-primary-valid-aphia-id={first.validAphiaId} data-primary-valid-name={first.validName}>
    <CardHeading eyebrow="WoRMS · Aphia taxonomic registry" title={requested ? `Taxonomy for ${requested}` : first.scientificName} description="The queried name and its current accepted-name relationship remain separate. An unaccepted name is never presented as if it were the current accepted taxon."><span className="domain-state">{first.status ?? 'Status not supplied'}</span></CardHeading>
    <ol className="biodiversity-record-list worms-taxon-list" aria-label="WoRMS taxon matches">
      {taxa.slice(0, 10).map((taxon, index) => {
        const acceptedDiffers = Boolean(taxon.validName && (taxon.validName !== taxon.scientificName || taxon.validAphiaId !== taxon.aphiaId))
        return <li key={`${taxon.aphiaId ?? taxon.scientificName}-${index}`} data-taxon-index={index + 1} data-aphia-id={taxon.aphiaId} data-status={taxon.status} data-valid-aphia-id={taxon.validAphiaId} data-valid-name={taxon.validName}>
          <header><div><small>{taxon.aphiaId === undefined ? 'AphiaID not supplied' : `AphiaID ${numericText(taxon.aphiaId)}`}</small><h4>{taxon.scientificName}</h4>{taxon.authority && <p>{taxon.authority}</p>}</div><span>{taxon.status ?? 'Status not supplied'}</span></header>
          <Facts items={[
            { label: 'Rank', value: taxon.rank ?? 'Not supplied' },
            { label: 'Current accepted name', value: taxon.validName ?? 'Not supplied' },
            { label: 'Accepted AphiaID', value: taxon.validAphiaId === undefined ? 'Not supplied' : numericText(taxon.validAphiaId) },
            { label: 'Accepted authority', value: taxon.validAuthority ?? 'Not supplied' },
            { label: 'Marine', value: yesNoUnknown(taxon.isMarine) },
            { label: 'Extinct', value: yesNoUnknown(taxon.isExtinct) },
          ]}/>
          {acceptedDiffers && <div className="accepted-name-callout"><strong>Accepted-name resolution</strong><span>{taxon.scientificName} → {taxon.validName}</span><small>WoRMS valid_AphiaID {taxon.validAphiaId ?? 'not supplied'} identifies the current final accepted name.</small></div>}
          {taxon.unacceptReason && <p className="biodiversity-note"><strong>Unaccepted reason:</strong> {taxon.unacceptReason}</p>}
          {taxon.lineage.length > 0 && <p className="biodiversity-note"><strong>Classification:</strong> {taxon.lineage.join(' › ')}</p>}
          {taxon.lsid && <p className="biodiversity-note"><strong>LSID:</strong> <code>{taxon.lsid}</code></p>}
          <Facts items={[{ label: 'Brackish', value: yesNoUnknown(taxon.isBrackish) }, { label: 'Freshwater', value: yesNoUnknown(taxon.isFreshwater) }, { label: 'Terrestrial', value: yesNoUnknown(taxon.isTerrestrial) }, { label: 'Record modified', value: taxon.modified ?? 'Not supplied' }]}/>
        </li>
      })}
    </ol>
    {taxa.length > 10 && <p className="domain-note">Showing the first 10 of {taxa.length} returned AphiaRecords. Raw JSON retains the complete response.</p>}
    <p className="domain-note">WoRMS keeps stable Aphia identifiers for names. The provider’s valid_AphiaID points to the current final accepted name, so synonym or unaccepted-name relationships must remain visible.</p>
  </div>
}
