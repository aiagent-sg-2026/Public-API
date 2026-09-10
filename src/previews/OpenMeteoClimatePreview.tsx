import { CardEmpty, CardHeading, Facts, asRecord, finite, numericText, text } from './cardPrimitives'
import { Sparkline } from './ChartPrimitives'

const requestModel = (requestUrl?: string) => {
  if (!requestUrl) return undefined
  try {
    return text(new URL(requestUrl).searchParams.get('models'))
  } catch {
    return undefined
  }
}

const boundedTrend = (values: number[], maxPoints = 180) => {
  if (values.length <= maxPoints) return values
  const step = Math.ceil(values.length / maxPoints)
  const sampled = values.filter((_, index) => index % step === 0)
  const last = values.at(-1)
  if (last !== undefined && sampled.at(-1) !== last) sampled.push(last)
  return sampled
}

export function OpenMeteoClimatePreview({ data, requestUrl }: { data: unknown; requestUrl?: string }) {
  const root = asRecord(data)
  const daily = asRecord(root.daily)
  const units = asRecord(root.daily_units)
  const dateValues = Array.isArray(daily.time) ? daily.time.map(text) : []
  const temperatures = Array.isArray(daily.temperature_2m_mean) ? daily.temperature_2m_mean : []
  const precipitation = Array.isArray(daily.precipitation_sum) ? daily.precipitation_sum : []
  const series = dateValues.flatMap((date, index) => {
    const temperature = finite(temperatures[index])
    return date && temperature !== undefined ? [{ date, temperature, precipitation: finite(precipitation[index]) }] : []
  })
  const model = requestModel(requestUrl)

  if (!series.length) {
    return <CardEmpty domain="climate-projection" title="Climate projection unavailable" detail="Open-Meteo did not return a dated daily mean-temperature series for this request." state="empty"/>
  }

  const values = series.map((entry) => entry.temperature)
  const firstDate = series[0].date
  const lastDate = series.at(-1)!.date
  const latestTemperature = values.at(-1)!
  const averageTemperature = values.reduce((sum, value) => sum + value, 0) / values.length
  const precipitationValues = series.map((entry) => entry.precipitation).filter((value): value is number => value !== undefined)
  const totalPrecipitation = precipitationValues.reduce((sum, value) => sum + value, 0)
  const temperatureUnit = text(units.temperature_2m_mean) ?? '°C'
  const precipitationUnit = text(units.precipitation_sum) ?? 'mm'
  const latitude = finite(root.latitude)
  const longitude = finite(root.longitude)
  const elevation = finite(root.elevation)

  return <div
    className="domain-card open-meteo-climate-preview"
    data-domain-card="climate-projection"
    data-result-state="ready"
    data-primary-model={model}
    data-period-start={firstDate}
    data-period-end={lastDate}
    data-observation-count={series.length}
    data-latest-temperature={latestTemperature}
    data-temperature-unit={temperatureUnit}
    data-precipitation-unit={precipitationUnit}
  >
    <CardHeading
      eyebrow="Open-Meteo · HighResMIP / CMIP6 climate projection"
      title={model ? `${model} climate projection` : 'Climate model projection'}
      description={`${firstDate} → ${lastDate}${latitude !== undefined && longitude !== undefined ? ` · ${numericText(latitude)}, ${numericText(longitude)}` : ''}`}
    ><span className="domain-state">Modelled, not observed</span></CardHeading>
    <Sparkline values={boundedTrend(values)} label={`${model ?? 'Open-Meteo climate model'} daily mean temperature trend`}/>
    <Facts items={[
      { label: 'Model', value: model ?? 'Not repeated by provider response' },
      { label: 'Response range', value: `${firstDate} → ${lastDate}` },
      { label: 'Latest daily mean', value: `${numericText(latestTemperature)} ${temperatureUnit}` },
      { label: 'Period mean', value: `${numericText(averageTemperature)} ${temperatureUnit}` },
      { label: 'Total precipitation', value: `${numericText(totalPrecipitation)} ${precipitationUnit}` },
      { label: 'Returned days', value: numericText(series.length) },
      ...(elevation === undefined ? [] : [{ label: 'Downscaled elevation', value: `${numericText(elevation)} m` }]),
    ]}/>
    <p className="domain-note">The model identity comes from the executed request because this response does not repeat the selected model. Open-Meteo describes this Climate API as downscaled HighResMIP climate-model output; retain the model and date range when interpreting the projection.</p>
  </div>
}
