import { asRecord, CardEmpty, CardHeading, Facts, finite, numericText, rows, text } from './cardPrimitives'
import { cleanText } from './previewData'

type OccurrenceModel = {
  scientificName: string
  originalScientificName?: string
  occurrenceId?: string
  eventDate?: string
  occurrenceStatus?: string
  basisOfRecord?: string
  latitude?: number
  longitude?: number
  minimumDepth?: number
  maximumDepth?: number
  datasetName?: string
  scientificNameId?: string
  aphiaId?: number
  flags: string[]
  license?: string
}

const occurrenceModel = (value: unknown): OccurrenceModel | undefined => {
  const row = asRecord(value)
  const scientificName = cleanText(row.scientificName)
  if (!scientificName) return undefined
  return {
    scientificName,
    originalScientificName: cleanText(row.originalScientificName),
    occurrenceId: text(row.occurrenceID),
    eventDate: text(row.eventDate),
    occurrenceStatus: text(row.occurrenceStatus),
    basisOfRecord: text(row.basisOfRecord),
    latitude: finite(row.decimalLatitude),
    longitude: finite(row.decimalLongitude),
    minimumDepth: finite(row.minimumDepthInMeters),
    maximumDepth: finite(row.maximumDepthInMeters),
    datasetName: cleanText(row.datasetName),
    scientificNameId: text(row.scientificNameID),
    aphiaId: finite(row.aphiaID),
    flags: Array.isArray(row.flags) ? row.flags.filter((flag): flag is string => typeof flag === 'string' && Boolean(flag.trim())) : [],
    license: text(row.license),
  }
}

const requestedName = (requestUrl?: string) => {
  if (!requestUrl) return undefined
  try { return new URL(requestUrl).searchParams.get('scientificname') ?? undefined } catch { return undefined }
}
const coordinate = (latitude?: number, longitude?: number) => latitude === undefined || longitude === undefined ? 'Not supplied' : `${numericText(latitude)}, ${numericText(longitude)}`
const depth = (minimum?: number, maximum?: number) => {
  if (minimum === undefined && maximum === undefined) return 'Not supplied'
  if (minimum !== undefined && maximum !== undefined) return minimum === maximum ? `${numericText(minimum)} m` : `${numericText(minimum)}–${numericText(maximum)} m`
  return `${numericText((minimum ?? maximum)!)} m`
}

export function ObisOccurrencePreview({ data, requestUrl }: { data: unknown; requestUrl?: string }) {
  const root = asRecord(data)
  const occurrences = rows(root.results).map(occurrenceModel).filter((row): row is OccurrenceModel => Boolean(row))
  const total = finite(root.total)
  if (!occurrences.length) return <CardEmpty domain="marine-occurrences" title="No marine occurrences returned" detail="OBIS returned no usable occurrence records for this scientific-name request." state="empty"/>
  const first = occurrences[0]
  const requested = requestedName(requestUrl)
  return <div className="domain-card obis-occurrence-preview" data-domain-card="marine-occurrences" data-result-state="ready" data-requested-scientific-name={requested} data-provider-total={total} data-visible-occurrence-count={occurrences.length} data-primary-occurrence-id={first.occurrenceId} data-primary-scientific-name={first.scientificName} data-primary-occurrence-status={first.occurrenceStatus} data-primary-basis-of-record={first.basisOfRecord} data-primary-latitude={first.latitude} data-primary-longitude={first.longitude} data-primary-quality-flags={first.flags.join(',')}>
    <CardHeading eyebrow="OBIS · Darwin Core occurrence records" title={total === undefined ? `${occurrences.length} returned marine occurrence${occurrences.length === 1 ? '' : 's'}` : `${occurrences.length} shown · ${numericText(total)} matching occurrences`} description={requested ? `Occurrence records returned for scientific-name filter “${requested}”. Status, provenance and quality flags remain attached to each record.` : 'Marine occurrence records with status, provenance and quality context.'}><span className="domain-state">Occurrence evidence</span></CardHeading>
    <ol className="biodiversity-record-list obis-occurrence-list" aria-label="OBIS marine occurrence records">
      {occurrences.map((occurrence, index) => <li key={`${occurrence.occurrenceId ?? occurrence.scientificName}-${index}`} data-occurrence-index={index + 1} data-occurrence-id={occurrence.occurrenceId} data-scientific-name={occurrence.scientificName} data-occurrence-status={occurrence.occurrenceStatus} data-basis-of-record={occurrence.basisOfRecord} data-latitude={occurrence.latitude} data-longitude={occurrence.longitude} data-quality-flags={occurrence.flags.join(',')}>
        <header><div><small>{occurrence.occurrenceId ?? 'Occurrence ID not supplied'}</small><h4>{occurrence.scientificName}</h4></div><span>{occurrence.occurrenceStatus ?? 'Status not supplied'}</span></header>
        <Facts items={[
          { label: 'Event date', value: occurrence.eventDate ? (occurrence.eventDate.includes('/') ? occurrence.eventDate : <time dateTime={occurrence.eventDate}>{occurrence.eventDate}</time>) : 'Not supplied' },
          { label: 'Basis of record', value: occurrence.basisOfRecord ?? 'Not supplied' },
          { label: 'Coordinates · WGS84', value: coordinate(occurrence.latitude, occurrence.longitude) },
          { label: 'Depth', value: depth(occurrence.minimumDepth, occurrence.maximumDepth) },
          { label: 'Dataset', value: occurrence.datasetName ?? 'Not supplied' },
          { label: 'WoRMS AphiaID', value: occurrence.aphiaId === undefined ? 'Not supplied' : numericText(occurrence.aphiaId) },
        ]}/>
        {occurrence.originalScientificName && occurrence.originalScientificName !== occurrence.scientificName && <p className="biodiversity-note"><strong>Original scientific name:</strong> {occurrence.originalScientificName}</p>}
        {occurrence.scientificNameId && <p className="biodiversity-note"><strong>Scientific name ID:</strong> <code>{occurrence.scientificNameId}</code></p>}
        <div className="biodiversity-flags" aria-label={`Quality flags for ${occurrence.occurrenceId ?? occurrence.scientificName}`}>{occurrence.flags.length ? occurrence.flags.map((flag) => <span key={flag}>{flag}</span>) : <span>No provider QC flags</span>}</div>
        {occurrence.license && <p className="biodiversity-note"><strong>Record license:</strong> {occurrence.license}</p>}
      </li>)}
    </ol>
    <p className="domain-note">OBIS aggregates occurrence records from many datasets. Provider QC flags are useful review signals, not automatic proof that an occurrence is invalid; dataset licensing and the complete source record remain available in Raw JSON.</p>
  </div>
}
