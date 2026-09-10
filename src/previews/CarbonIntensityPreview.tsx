import { asRecord, CardEmpty, CardHeading, Facts, finite, rows, text } from './cardPrimitives'

const intensityValue = (value: unknown) => {
  const number = finite(value)
  return number === undefined ? 'Not supplied' : `${number} gCO₂/kWh`
}

const indexLabel = (value: string | undefined) => value
  ? value.replace(/\b\w/g, (character) => character.toUpperCase())
  : 'Not supplied'

export function CarbonIntensityPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const record = rows(root.data)[0]
  const intensity = asRecord(record?.intensity)

  if (!record || !Object.keys(intensity).length) {
    return <CardEmpty
      domain="carbon-intensity"
      title="Carbon intensity unavailable"
      detail="NESO did not return a current half-hour carbon-intensity record."
      state="empty"
    />
  }

  const forecast = finite(intensity.forecast)
  const actual = finite(intensity.actual)
  const index = text(intensity.index)
  const from = text(record.from)
  const to = text(record.to)
  const primary = actual ?? forecast

  return <div
    className="domain-card carbon-intensity-preview"
    data-domain-card="carbon-intensity"
    data-result-state="ready"
    data-primary-intensity-gco2-kwh={primary}
    data-primary-index={index}
    data-forecast-gco2-kwh={forecast}
    data-actual-gco2-kwh={actual}
    data-period-from={from}
    data-period-to={to}
  >
    <CardHeading
      eyebrow="NESO · Great Britain"
      title={`${indexLabel(index)} carbon intensity`}
      description="Current half-hour electricity-generation carbon intensity, preserving the provider forecast and estimated actual independently."
    >
      {primary !== undefined && <span className="domain-state">{primary} gCO₂/kWh</span>}
    </CardHeading>

    <Facts items={[
      { label: 'Estimated actual', value: intensityValue(actual) },
      { label: 'Forecast', value: intensityValue(forecast) },
      { label: 'Intensity index', value: indexLabel(index) },
      { label: 'Interval start (UTC)', value: from ? <time dateTime={from}>{from}</time> : 'Not supplied' },
      { label: 'Interval end (UTC)', value: to ? <time dateTime={to}>{to}</time> : 'Not supplied' },
    ]}/>

    <p className="domain-note">NESO documents this endpoint as the current half-hour GB carbon-intensity record. The API reports forecast and estimated actual values in gCO₂/kWh, and all returned interval times are UTC.</p>
  </div>
}
