import { asRecord, CardEmpty, CardHeading, Facts, finite, numericText, rows, text } from './cardPrimitives'
import { cleanText } from './previewData'

type SatelliteModel = {
  name: string; objectId?: string; noradId?: number; epoch?: string; meanMotion?: number; eccentricity?: number;
  inclination?: number; rightAscension?: number; argumentOfPericenter?: number; meanAnomaly?: number;
  classification?: string; elementSet?: number; revolutionAtEpoch?: number
}

const satelliteModel = (value: unknown): SatelliteModel | undefined => {
  const row = asRecord(value)
  const noradId = finite(row.NORAD_CAT_ID)
  const name = cleanText(row.OBJECT_NAME) ?? (noradId !== undefined ? `NORAD ${noradId}` : undefined)
  if (!name) return undefined
  return {
    name, noradId, objectId: text(row.OBJECT_ID), epoch: text(row.EPOCH), meanMotion: finite(row.MEAN_MOTION),
    eccentricity: finite(row.ECCENTRICITY), inclination: finite(row.INCLINATION), rightAscension: finite(row.RA_OF_ASC_NODE),
    argumentOfPericenter: finite(row.ARG_OF_PERICENTER), meanAnomaly: finite(row.MEAN_ANOMALY),
    classification: text(row.CLASSIFICATION_TYPE), elementSet: finite(row.ELEMENT_SET_NO), revolutionAtEpoch: finite(row.REV_AT_EPOCH),
  }
}

const requestedGroup = (requestUrl?: string) => {
  if (!requestUrl) return undefined
  try { return new URL(requestUrl).searchParams.get('GROUP') ?? undefined } catch { return undefined }
}
const degree = (value?: number) => value === undefined ? 'Not supplied' : `${numericText(value)}°`
const number = (value?: number) => value === undefined ? 'Not supplied' : numericText(value)

export function CelestrakSatellitesPreview({ data, requestUrl }: { data: unknown; requestUrl?: string }) {
  const satellites = rows(data).map(satelliteModel).filter((satellite): satellite is SatelliteModel => Boolean(satellite))
  if (!satellites.length) return <CardEmpty domain="satellite-orbits" title="No GP orbital elements returned" detail="CelesTrak returned no usable OMM-style JSON satellite records for this request." state="empty"/>
  const group = requestedGroup(requestUrl)
  const first = satellites[0]
  const visible = satellites.slice(0, 12)
  return <div className="domain-card celestrak-satellites-preview" data-domain-card="satellite-orbits" data-result-state="ready" data-requested-group={group} data-satellite-count={satellites.length} data-visible-satellite-count={visible.length} data-primary-norad-id={first.noradId} data-primary-object-id={first.objectId} data-primary-epoch={first.epoch} data-primary-mean-motion-rev-day={first.meanMotion} data-primary-inclination-degrees={first.inclination}>
    <CardHeading eyebrow="CelesTrak · General Perturbations data" title={`${satellites.length} orbital-element record${satellites.length === 1 ? '' : 's'}`} description="CelesTrak JSON uses CCSDS OMM field names. These are orbital elements at their supplied epoch, not real-time satellite positions."><span className="domain-state">{group ? `GROUP=${group}` : 'GP data'}</span></CardHeading>
    <ol className="satellite-orbit-list" aria-label="CelesTrak satellite orbital elements">
      {visible.map((satellite, index) => <li key={`${satellite.noradId ?? satellite.objectId ?? satellite.name}-${index}`} data-satellite-index={index + 1} data-norad-id={satellite.noradId} data-object-id={satellite.objectId} data-epoch={satellite.epoch} data-mean-motion-rev-day={satellite.meanMotion} data-inclination-degrees={satellite.inclination}>
        <header><div><small>{satellite.objectId ?? 'International designator not supplied'}</small><h4>{satellite.name}</h4></div><span>{satellite.noradId === undefined ? 'NORAD ID not supplied' : `NORAD ${numericText(satellite.noradId)}`}</span></header>
        <Facts items={[
          { label: 'Epoch · UTC', value: satellite.epoch ? <time dateTime={`${satellite.epoch}Z`}>{satellite.epoch}</time> : 'Not supplied' },
          { label: 'Mean motion', value: satellite.meanMotion === undefined ? 'Not supplied' : `${numericText(satellite.meanMotion)} rev/day` },
          { label: 'Inclination', value: degree(satellite.inclination) }, { label: 'Eccentricity', value: number(satellite.eccentricity) },
          { label: 'RA of ascending node', value: degree(satellite.rightAscension) }, { label: 'Argument of pericenter', value: degree(satellite.argumentOfPericenter) },
          { label: 'Mean anomaly', value: degree(satellite.meanAnomaly) }, { label: 'Classification', value: satellite.classification ?? 'Not supplied' },
          { label: 'Element set', value: number(satellite.elementSet) }, { label: 'Revolution at epoch', value: number(satellite.revolutionAtEpoch) },
        ]}/>
      </li>)}
    </ol>
    {satellites.length > visible.length && <p className="domain-note">Showing the first {visible.length} of {satellites.length} returned orbital-element records. Raw JSON retains the complete provider response.</p>}
    <p className="domain-note">CelesTrak asks GP clients to download data only once per update. Automated verification remains cadence-limited by the catalog SSOT; this semantic card does not weaken that provider policy.</p>
  </div>
}
