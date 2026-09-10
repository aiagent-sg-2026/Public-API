import { asRecord, CardEmpty, CardHeading, Facts, finite, numericText, rows, text } from './cardPrimitives'

const parameterLabel = (code: string | undefined) => {
  if (code === '00060') return 'Streamflow / discharge'
  if (code === '00065') return 'Gage height'
  return code ? `USGS parameter ${code}` : 'Continuous measurement'
}

const qualifiers = (value: unknown) => Array.isArray(value)
  ? value.map((item) => text(item)).filter((item): item is string => Boolean(item))
  : text(value) ? [text(value)!] : []

export function UsgsWaterPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const feature = rows(root.features)[0]
  const properties = asRecord(feature?.properties)
  const geometry = asRecord(feature?.geometry)
  const coordinates = Array.isArray(geometry.coordinates) ? geometry.coordinates : []
  const longitude = finite(coordinates[0])
  const latitude = finite(coordinates[1])
  const value = finite(properties.value)
  const unit = text(properties.unit_of_measure)
  const locationId = text(properties.monitoring_location_id)
  const parameterCode = text(properties.parameter_code)
  const observedAt = text(properties.time)
  const approvalStatus = text(properties.approval_status)
  const timeSeriesId = text(properties.time_series_id)
  const qualifierList = qualifiers(properties.qualifier)

  if (!feature || value === undefined || !locationId || !parameterCode) {
    return <CardEmpty
      domain="water-gauge"
      title="USGS continuous observation unavailable"
      detail="The Water Data API did not return a usable latest-continuous observation for this monitoring location and measurement."
      state="empty"
    />
  }

  const valueLabel = `${numericText(value)}${unit ? ` ${unit}` : ''}`
  const locationLabel = locationId.replace(/^USGS-/, '')

  return <div
    className="domain-card usgs-water-preview"
    data-domain-card="water-gauge"
    data-result-state="ready"
    data-monitoring-location-id={locationId}
    data-parameter-code={parameterCode}
    data-primary-value={value}
    data-unit-of-measure={unit}
    data-observed-at={observedAt}
    data-approval-status={approvalStatus}
    data-latitude={latitude}
    data-longitude={longitude}
  >
    <CardHeading
      eyebrow="USGS Water Data API V1"
      title={`${valueLabel} ${parameterLabel(parameterCode).toLowerCase()}`}
      description={`Monitoring location ${locationLabel} · latest continuous sensor observation`}
    >
      {approvalStatus && <span className="domain-state">{approvalStatus}</span>}
    </CardHeading>

    <Facts items={[
      { label: 'Monitoring location', value: locationId },
      { label: 'Measurement', value: `${parameterLabel(parameterCode)} (${parameterCode})` },
      { label: 'Observed (UTC)', value: observedAt ? <time dateTime={observedAt}>{observedAt}</time> : 'Not supplied' },
      { label: 'Approval status', value: approvalStatus ?? 'Not supplied' },
      { label: 'Qualifier', value: qualifierList.length ? qualifierList.join(', ') : 'None reported' },
      { label: 'Coordinates', value: latitude !== undefined && longitude !== undefined ? `${numericText(latitude)}, ${numericText(longitude)}` : 'Not supplied' },
      { label: 'Time-series ID', value: timeSeriesId ?? 'Not supplied' },
    ]}/>

    <p className="domain-note">The modern USGS latest-continuous collection returns the newest observation for the selected sensor time series. Provisional observations can change after USGS review; approved values are published records.</p>
  </div>
}
