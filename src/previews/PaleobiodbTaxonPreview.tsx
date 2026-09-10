import { asRecord, CardEmpty, CardHeading, Facts, finite, numericText, rows, text } from './cardPrimitives'
import { cleanText } from './previewData'

type FossilTaxon = {
  taxonNo?: string
  originalNo?: string
  name: string
  rank?: string
  acceptedNo?: string
  acceptedName?: string
  acceptedRank?: string
  parentNo?: string
  referenceNo?: string
  extancy?: string
  occurrenceCount?: number
}

const model = (value: unknown): FossilTaxon | undefined => {
  const row = asRecord(value)
  const name = cleanText(row.taxon_name)
  if (!name) return undefined
  return {
    taxonNo: text(row.taxon_no), originalNo: text(row.orig_no), name, rank: text(row.taxon_rank), acceptedNo: text(row.accepted_no),
    acceptedName: cleanText(row.accepted_name), acceptedRank: text(row.accepted_rank), parentNo: text(row.parent_no), referenceNo: text(row.reference_no),
    extancy: text(row.is_extant), occurrenceCount: finite(row.n_occs),
  }
}
const requestedName = (requestUrl?: string) => {
  if (!requestUrl) return undefined
  try {
    const url = new URL(requestUrl)
    return url.searchParams.get('name') ?? url.searchParams.get('taxon_name') ?? undefined
  } catch { return undefined }
}

export function PaleobiodbTaxonPreview({ data, requestUrl }: { data: unknown; requestUrl?: string }) {
  const root = asRecord(data)
  const taxa = rows(root.records).map(model).filter((taxon): taxon is FossilTaxon => Boolean(taxon))
  if (!taxa.length) return <CardEmpty domain="fossil-taxon" title="No fossil taxon returned" detail="Paleobiology Database returned no usable taxon record for this name." state="empty"/>
  const first = taxa[0]
  const requested = requestedName(requestUrl)
  return <div className="domain-card paleobiodb-taxon-preview" data-domain-card="fossil-taxon" data-result-state="ready" data-requested-taxon-name={requested} data-taxon-count={taxa.length} data-primary-taxon-no={first.taxonNo} data-primary-taxon-name={first.name} data-primary-rank={first.rank} data-primary-extancy={first.extancy} data-primary-fossil-occurrence-count={first.occurrenceCount} data-primary-accepted-name={first.acceptedName}>
    <CardHeading eyebrow="Paleobiology Database · Taxonomic names" title={requested ? `Fossil taxon · ${requested}` : first.name} description="PBDB taxon identity, accepted-name relationship and extancy stay explicit. Fossil occurrence counts include records assigned to this taxon or any of its subtaxa."><span className="domain-state">{first.extancy ?? 'Extancy not supplied'}</span></CardHeading>
    <ol className="biodiversity-record-list paleobiodb-taxon-list" aria-label="Paleobiology Database taxon records">
      {taxa.map((taxon, index) => <li key={`${taxon.taxonNo ?? taxon.name}-${index}`} data-taxon-index={index + 1} data-taxon-no={taxon.taxonNo} data-taxon-name={taxon.name} data-rank={taxon.rank} data-extancy={taxon.extancy} data-fossil-occurrence-count={taxon.occurrenceCount} data-accepted-name={taxon.acceptedName}>
        <header><div><small>{taxon.taxonNo ? `PBDB taxon ${taxon.taxonNo}` : 'Taxon ID not supplied'}</small><h4>{taxon.name}</h4></div><span>{taxon.extancy ?? 'Extancy not supplied'}</span></header>
        <Facts items={[
          { label: 'Rank', value: taxon.rank ?? 'Not supplied' },
          { label: 'Accepted name', value: taxon.acceptedName ?? 'Not supplied' },
          { label: 'Accepted taxon ID', value: taxon.acceptedNo ?? 'Not supplied' },
          { label: 'Fossil occurrences · taxon + subtaxa', value: taxon.occurrenceCount === undefined ? 'Not supplied' : numericText(taxon.occurrenceCount) },
          { label: 'Parent taxon ID', value: taxon.parentNo ?? 'Not supplied' },
          { label: 'Name reference ID', value: taxon.referenceNo ?? 'Not supplied' },
        ]}/>
        {taxon.originalNo && taxon.originalNo !== taxon.taxonNo && <p className="biodiversity-note"><strong>Original taxon ID:</strong> {taxon.originalNo}</p>}
        {taxon.acceptedRank && taxon.acceptedRank !== taxon.rank && <p className="biodiversity-note"><strong>Accepted rank:</strong> {taxon.acceptedRank}</p>}
      </li>)}
    </ol>
    <p className="domain-note">PBDB defines n_occs as fossil occurrences identified as this taxon or any subtaxa. It is not a direct-only occurrence count for the named taxon.</p>
  </div>
}
