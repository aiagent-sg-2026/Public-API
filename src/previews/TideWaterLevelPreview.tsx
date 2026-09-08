import { asRecord, CardEmpty, CardHeading, Facts, finite, text } from './cardPrimitives'

type RequestContext = {
  datum: string
  units: string
  timeZone: string
  dateMode: string
}

const requestContext = (requestUrl?: string): RequestContext => {
  try {
    const url = new URL(requestUrl ?? '')
    return {
      datum: url.searchParams.get('datum')?.trim().toUpperCase() || 'MLLW',
      units: url.searchParams.get('units')?.trim().toLowerCase() || 'metric',
      timeZone: url.searchParams.get('time_zone')?.trim().toLowerCase() || 'gmt',
      dateMode: url.searchParams.get('date')?.trim().toLowerCase() || 'latest',
    }
  } catch {
    return { datum: 'MLLW', units: 'metric', timeZone: 'gmt', dateMode: 'latest' }
  }
}

const heightUnit = (units: string) => units === 'english' ? 'ft' : 'm'
const timeZoneLabel = (zone: string) => zone === 'gmt' ? 'GMT' : zone === 'lst_ldt' ? 'Local time (DST-adjusted)' : zone === 'lst' ? 'Local standard time' : zone.toUpperCase()
const datumLabel = (datum: string) => datum === 'MLLW' ? 'Mean Lower Low Water (MLLW)' : datum
const qualityLabel = (quality?: string) => quality === 'p' ? 'Preliminary' : quality === 'v' ? 'Verified' : quality ? quality : 'Not supplied'
const providerDateTime = (value?: string, timeZone?: string) => {
  if (!value) return undefined
  if (timeZone === 'gmt' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) return `${value.replace(' ', 'T')}:00Z`
  return undefined
}

const flagValue = (value: string | undefined) => value === undefined || value === '' ? 'Not supplied' : value === '1' ? 'Yes' : value === '0' ? 'No' : value

export function TideWaterLevelPreview({ data, requestUrl }: { data: unknown; requestUrl?: string }) {
  const root = asRecord(data)
  const metadata = asRecord(root.metadata)
  const readings = Array.isArray(root.data) ? root.data.map(asRecord).filter((row) => Object.keys(row).length > 0) : []
  const reading = readings[0]
  if (!reading) return <CardEmpty domain="coastal-water-level" title="Water-level observation unavailable" detail="NOAA did not return a water-level data point for this station." state="empty"/>

  const context = requestContext(requestUrl)
  const stationId = text(metadata.id)
  const stationName = text(metadata.name) ?? stationId ?? 'NOAA CO-OPS station'
  const latitude = finite(metadata.lat)
  const longitude = finite(metadata.lon)
  const waterLevel = finite(reading.v)
  const sigma = finite(reading.s)
  const observedAt = text(reading.t)
  const qualityCode = text(reading.q)?.toLowerCase()
  const rawFlags = text(reading.f)
  const flags = rawFlags?.split(',').map((value) => value.trim()) ?? []
  const unit = heightUnit(context.units)
  const observedDateTime = providerDateTime(observedAt, context.timeZone)
  const quality = qualityLabel(qualityCode)
  const firstFlagLabel = qualityCode === 'p' ? 'Samples outside 3σ band' : qualityCode === 'v' ? 'Inferred value' : 'Provider flag 1'
  const firstFlagValue = qualityCode === 'p' ? (flags[0] || 'Not supplied') : qualityCode === 'v' ? flagValue(flags[0]) : (flags[0] || 'Not supplied')

  return <div
    className="domain-card tide-water-level-preview"
    data-domain-card="coastal-water-level"
    data-result-state="ready"
    data-station-id={stationId}
    data-station-name={stationName}
    data-primary-water-level={waterLevel}
    data-water-level-unit={unit}
    data-observed-at={observedAt}
    data-quality-level={qualityCode}
    data-datum={context.datum}
    data-time-zone={context.timeZone}
    data-sigma={sigma}
    data-flags={rawFlags}
    data-latitude={latitude}
    data-longitude={longitude}
  >
    <CardHeading
      eyebrow="NOAA CO-OPS water level"
      title={stationName}
      description={stationId ? `Station ${stationId} · Latest returned coastal water-level observation` : 'Latest returned coastal water-level observation'}
    >
      <span className={`domain-state${qualityCode === 'p' ? ' warning' : ''}`}>{quality}</span>
    </CardHeading>

    <section className="tide-reading" aria-labelledby="tide-reading-heading">
      <div>
        <span id="tide-reading-heading">Water level</span>
        <strong>{waterLevel === undefined ? 'Not supplied' : waterLevel.toLocaleString('en', { maximumSignificantDigits: 12 })} <small>{unit}</small></strong>
        <p>Relative to {datumLabel(context.datum)}</p>
      </div>
      <dl>
        <div><dt>Observed</dt><dd>{observedAt ? <time dateTime={observedDateTime}>{observedAt} {timeZoneLabel(context.timeZone)}</time> : 'Not supplied'}</dd></div>
        <div><dt>QA/QC level</dt><dd>{quality}</dd></div>
        <div><dt>1-second sample σ</dt><dd>{sigma === undefined ? 'Not supplied' : `${sigma.toLocaleString('en', { maximumSignificantDigits: 12 })} ${unit}`}</dd></div>
      </dl>
    </section>

    <Facts items={[
      { label: 'Station ID', value: stationId ?? 'Not supplied' },
      { label: 'Coordinates', value: latitude !== undefined && longitude !== undefined ? `${latitude}, ${longitude}` : 'Not supplied' },
      { label: 'Datum', value: datumLabel(context.datum) },
      { label: 'Units', value: context.units === 'english' ? 'English' : 'Metric' },
      { label: 'Time zone', value: timeZoneLabel(context.timeZone) },
      { label: 'Request window', value: context.dateMode === 'latest' ? 'Latest point available within 18 minutes' : context.dateMode },
    ]}/>

    {flags.length > 0 && <section className="tide-quality" aria-labelledby="tide-quality-heading">
      <h4 id="tide-quality-heading">Quality-control flags</h4>
      <dl>
        <div><dt>{firstFlagLabel}</dt><dd>{firstFlagValue}</dd></div>
        <div><dt>Flat tolerance exceeded</dt><dd>{flagValue(flags[1])}</dd></div>
        <div><dt>Rate-of-change tolerance exceeded</dt><dd>{flagValue(flags[2])}</dd></div>
        <div><dt>Expected water-level limit exceeded</dt><dd>{flagValue(flags[3])}</dd></div>
      </dl>
    </section>}

    <p className="domain-note">NOAA defines <code>date=latest</code> as the last data point available within 18 minutes. Water-level values use the requested datum and units; the provider's QA/QC code determines whether the observation is preliminary or verified. Raw JSON retains the original sigma and flag fields.</p>
  </div>
}
