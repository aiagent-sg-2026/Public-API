import './stationList.css'
import { asRecord, CardEmpty, CardHeading, Facts, finite, numericText, rows, text } from './cardPrimitives'

const requestValue = (requestUrl: string | undefined, key: string) => {
  if (!requestUrl) return undefined
  try { return text(new URL(requestUrl).searchParams.get(key)) } catch { return undefined }
}

const statusLabel = (value: unknown) => {
  const raw = text(value)
  if (!raw) return 'Not supplied'
  const token = raw.split('/').filter(Boolean).at(-1) ?? raw
  return token.replace(/^status/i, '').replace(/([a-z])([A-Z])/g, '$1 $2') || raw
}

const coordinateLabel = (latitude: number | undefined, longitude: number | undefined) =>
  latitude === undefined || longitude === undefined ? 'Not supplied' : `${numericText(latitude)}, ${numericText(longitude)}`

const measureLabel = (value: Record<string, unknown>) => {
  const name = text(value.parameterName) ?? text(value.parameter) ?? 'Measurement'
  const qualifier = text(value.qualifier)
  const unit = text(value.unitName)
  const period = finite(value.period)
  return [name, qualifier, unit, period === undefined ? undefined : `${numericText(period)} s interval`].filter(Boolean).join(' · ')
}

export function FloodStationPreview({ data, requestUrl }: { data: unknown; requestUrl?: string }) {
  const root = asRecord(data)
  const stations = rows(root.items)
  const requestedRiver = requestValue(requestUrl, 'riverName')

  if (!stations.length) {
    return <CardEmpty
      domain="flood-stations"
      title="No monitoring stations returned"
      detail={requestedRiver
        ? `The Environment Agency returned no stations for the exact river-name filter “${requestedRiver}”.`
        : 'The Environment Agency returned no monitoring stations for this request.'}
      state="empty"
    />
  }

  const first = stations[0]
  const firstReference = text(first.stationReference) ?? text(first.notation)
  const providerRiver = requestedRiver ?? text(first.riverName)

  return <div
    className="domain-card flood-stations-preview"
    data-domain-card="flood-stations"
    data-result-state="ready"
    data-requested-river={requestedRiver}
    data-station-count={stations.length}
    data-primary-station-reference={firstReference}
  >
    <CardHeading
      eyebrow="Environment Agency · Real-time flood monitoring API"
      title={`${stations.length} monitoring station${stations.length === 1 ? '' : 's'}${providerRiver ? ` · ${providerRiver}` : ''}`}
      description="Station and available-measure metadata from the provider response. Live readings and flood warnings are separate API resources."
    >
      <span className="domain-state">Station metadata</span>
    </CardHeading>

    <ol className="flood-station-list" aria-label="Environment Agency monitoring stations">
      {stations.map((station, index) => {
        const label = text(station.label) ?? `Station ${index + 1}`
        const river = text(station.riverName)
        const reference = text(station.stationReference) ?? text(station.notation)
        const latitude = finite(station.lat)
        const longitude = finite(station.long)
        const status = statusLabel(station.status)
        const measures = rows(station.measures)
        return <li
          key={reference ?? `${label}-${index}`}
          data-station-index={index + 1}
          data-station-reference={reference}
          data-river-name={river}
          data-station-status={status}
          data-latitude={latitude}
          data-longitude={longitude}
          data-measure-count={measures.length}
        >
          <header>
            <div><small>{river ?? 'River not supplied'}</small><h4>{label}</h4></div>
            <span>{status}</span>
          </header>
          <Facts items={[
            { label: 'Station reference', value: reference ?? 'Not supplied' },
            { label: 'Town', value: text(station.town) ?? 'Not supplied' },
            { label: 'Catchment', value: text(station.catchmentName) ?? 'Not supplied' },
            { label: 'Coordinates (WGS84)', value: coordinateLabel(latitude, longitude) },
          ]}/>
          <section className="flood-measures" aria-label={`${label} available measures`}>
            <h4>Available measures</h4>
            {measures.length
              ? <ul>{measures.map((measure, measureIndex) => <li key={text(measure['@id']) ?? `${reference}-measure-${measureIndex}`}>{measureLabel(measure)}</li>)}</ul>
              : <p>No measure metadata was supplied for this station.</p>}
          </section>
        </li>
      })}
    </ol>

    <p className="domain-note">The provider documents <code>riverName</code> as an exact-match filter. This card therefore preserves the returned river name, station identity, location, operational status, and available measurement types without claiming that station metadata is a current reading or flood alert.</p>
  </div>
}
