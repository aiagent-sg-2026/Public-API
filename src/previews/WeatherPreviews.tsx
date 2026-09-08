import type { CSSProperties } from 'react'
import type { ApiDemo } from '../apiCatalog'
import { cleanText, dateParts, findByKey, findPreviewRecords, forecastSymbol, formatNumber, isRecord, numberValue, previewLabel, previewValue, recordValue, textValue, timeLabel } from './previewData'

export type WeatherPreviewVariant = 'current' | 'four-day' | 'twenty-four-hour' | 'area-forecast' | 'station-readings' | 'regional-air-quality' | 'air-quality-forecast' | 'uv-index'

const stationWeatherIds = ['data-gov-air-temperature', 'data-gov-rainfall', 'data-gov-relative-humidity', 'data-gov-wind-direction', 'data-gov-wind-speed']

export function selectWeatherPreviewVariant(api: Pick<ApiDemo, 'id'>): WeatherPreviewVariant {
  if (api.id === 'open-meteo-air-quality') return 'air-quality-forecast'
  if (api.id === 'data-gov-4day-forecast') return 'four-day'
  if (api.id === 'data-gov-24hr-forecast') return 'twenty-four-hour'
  if (api.id === 'data-gov-forecast-2hr') return 'area-forecast'
  if (stationWeatherIds.includes(api.id)) return 'station-readings'
  if (['data-gov-pm25', 'data-gov-psi'].includes(api.id)) return 'regional-air-quality'
  if (api.id === 'data-gov-uv-index') return 'uv-index'
  return 'current'
}

const weatherCondition = (code: number | undefined) => {
  if (code === undefined) return { label: 'Live conditions', icon: '◌' }
  if (code === 0) return { label: 'Clear sky', icon: '☀' }
  if (code <= 3) return { label: 'Partly cloudy', icon: '☁' }
  if ([45, 48].includes(code)) return { label: 'Foggy', icon: '≋' }
  if (code <= 67 || [80, 81, 82].includes(code)) return { label: 'Rain showers', icon: '☂' }
  if (code >= 95) return { label: 'Thunderstorms', icon: 'ϟ' }
  return { label: 'Mixed conditions', icon: '◒' }
}

const firstResponseItem = (data: unknown) => {
  if (!isRecord(data) || !Array.isArray(data.items) || !isRecord(data.items[0])) return undefined
  return data.items[0]
}

const rangeValues = (value: unknown) => {
  const range = isRecord(value) ? value : {}
  return { low: numberValue(range.low), high: numberValue(range.high) }
}

const measurementMeta = (api: ApiDemo) => {
  if (api.id === 'data-gov-air-temperature') return { label: 'Air temperature', unit: '°C' }
  if (api.id === 'data-gov-pm25') return { label: 'PM2.5 reading', unit: ' µg/m³' }
  if (api.id === 'data-gov-psi') return { label: 'Air quality index', unit: ' PSI' }
  if (api.id === 'data-gov-rainfall') return { label: 'Rainfall', unit: ' mm' }
  if (api.id === 'data-gov-relative-humidity') return { label: 'Relative humidity', unit: '%' }
  if (api.id === 'data-gov-uv-index') return { label: 'UV index', unit: '' }
  if (api.id === 'data-gov-wind-direction') return { label: 'Wind direction', unit: '°' }
  if (api.id === 'data-gov-wind-speed') return { label: 'Wind speed', unit: ' km/h' }
  return { label: 'Current conditions', unit: undefined }
}

export function CurrentConditionsPreview({ data, api }: { data: unknown; api: ApiDemo }) {
  const root = isRecord(data) ? data : {}
  const current = isRecord(root.current) ? root.current : findPreviewRecords(data)[0] ?? {}
  const units = isRecord(root.current_units) ? root.current_units : {}
  const temperature = numberValue(current.temperature_2m ?? findByKey(data, ['temperature_2m', 'temperature', 'value']))
  const humidity = numberValue(current.relative_humidity_2m ?? findByKey(data, ['relative_humidity_2m', 'humidity']))
  const wind = numberValue(current.wind_speed_10m ?? findByKey(data, ['wind_speed_10m', 'wind_speed']))
  const code = numberValue(current.weather_code ?? findByKey(data, ['weather_code']))
  const condition = weatherCondition(code)
  const timezone = textValue(root.timezone) ?? textValue(findByKey(data, ['area', 'location'])) ?? 'Live station'
  const location = timezone.split('/').at(-1)?.replace(/_/g, ' ') ?? timezone
  const time = textValue(current.time ?? findByKey(data, ['timestamp', 'date']))
  const temperatureUnit = textValue(units.temperature_2m) ?? '°C'
  const measurement = measurementMeta(api)
  const primaryUnit = measurement.unit ?? temperatureUnit
  const metrics = [
    { label: 'Humidity', value: humidity === undefined ? 'Live reading' : `${formatNumber(humidity)}%`, icon: '◉' },
    { label: 'Wind speed', value: wind === undefined ? 'Live reading' : `${formatNumber(wind)} ${textValue(units.wind_speed_10m) ?? 'km/h'}`, icon: '≈' },
    { label: 'Coordinates', value: root.latitude !== undefined && root.longitude !== undefined ? `${formatNumber(Number(root.latitude), 3)}, ${formatNumber(Number(root.longitude), 3)}` : 'Station supplied', icon: '⌖' },
  ]
  return <div className="weather-preview">
    <div className="weather-hero">
      <div><span className="weather-location">⌖ {location}</span><strong>{temperature === undefined ? 'Live' : `${formatNumber(temperature)}${primaryUnit}`}</strong><b>{code === undefined ? measurement.label : condition.label}</b><small>{time ? `Updated ${time.replace('T', ' ')}` : 'Current observation'}</small></div>
      <span className="weather-symbol" aria-hidden="true">{condition.icon}</span>
    </div>
    <div className="weather-metrics">{metrics.map((metric) => <article key={metric.label}><span aria-hidden="true">{metric.icon}</span><div><small>{metric.label}</small><strong>{metric.value}</strong></div></article>)}</div>
  </div>
}

export function FourDayForecastPreview({ data }: { data: unknown }) {
  const item = firstResponseItem(data)
  const forecasts = item && Array.isArray(item.forecasts) ? item.forecasts.filter(isRecord).slice(0, 4) : []
  if (!item || !forecasts.length) return <div className="weather-empty"><strong>Forecast unavailable</strong><span>The response did not include daily forecast records.</span></div>
  const lead = forecasts[0]
  const leadTemperature = rangeValues(lead.temperature)
  const leadHumidity = rangeValues(lead.relative_humidity)
  const leadWind = isRecord(lead.wind) ? lead.wind : {}
  const leadWindSpeed = rangeValues(leadWind.speed)
  const leadForecast = cleanText(lead.forecast) ?? 'Forecast available'
  return <div className="weather-preview weather-forecast-preview" data-weather-view="four-day-outlook">
    <div className="forecast-lead">
      <div><span className="weather-location">⌖ Singapore · {dateParts(lead.date ?? lead.timestamp).full}</span><strong>{leadTemperature.high === undefined ? '—' : `${formatNumber(leadTemperature.high)}°`}<small>{leadTemperature.low === undefined ? '' : ` / ${formatNumber(leadTemperature.low)}°`}</small></strong><b>{leadForecast}</b><small>Updated {timeLabel(item.update_timestamp ?? item.timestamp)}</small></div>
      <span className="weather-symbol" aria-hidden="true">{forecastSymbol(leadForecast)}</span>
    </div>
    <div className="forecast-summary" aria-label="First forecast day details">
      <span><small>Humidity</small><strong>{leadHumidity.low ?? '—'}–{leadHumidity.high ?? '—'}%</strong></span>
      <span><small>Wind</small><strong>{leadWindSpeed.low ?? '—'}–{leadWindSpeed.high ?? '—'} km/h</strong></span>
      <span><small>Direction</small><strong>{previewValue(leadWind.direction)}</strong></span>
    </div>
    <div className="forecast-days">{forecasts.map((forecast, index) => {
      const date = dateParts(forecast.date ?? forecast.timestamp)
      const temperature = rangeValues(forecast.temperature)
      const humidity = rangeValues(forecast.relative_humidity)
      const description = cleanText(forecast.forecast) ?? 'Forecast'
      return <article className={index === 0 ? 'active' : ''} key={`${date.full}-${index}`}><div><span>{date.weekday}</span><small>{date.full}</small></div><b aria-hidden="true">{forecastSymbol(description)}</b><strong>{temperature.high ?? '—'}° <small>{temperature.low ?? '—'}°</small></strong><p>{description}</p><em>Humidity {humidity.low ?? '—'}–{humidity.high ?? '—'}%</em></article>
    })}</div>
  </div>
}

export function TwentyFourHourForecastPreview({ data }: { data: unknown }) {
  const item = firstResponseItem(data)
  const general = item && isRecord(item.general) ? item.general : undefined
  const periods = item && Array.isArray(item.periods) ? item.periods.filter(isRecord).slice(0, 3) : []
  if (!item || !general) return <div className="weather-empty"><strong>Forecast unavailable</strong><span>The response did not include a general forecast.</span></div>
  const temperature = rangeValues(general.temperature)
  const humidity = rangeValues(general.relative_humidity)
  const wind = isRecord(general.wind) ? general.wind : {}
  const windSpeed = rangeValues(wind.speed)
  const description = cleanText(general.forecast) ?? '24-hour forecast'
  return <div className="weather-preview weather-forecast-preview" data-weather-view="twenty-four-hour">
    <div className="forecast-lead compact"><div><span className="weather-location">⌖ Singapore · next 24 hours</span><strong>{temperature.high ?? '—'}°<small> / {temperature.low ?? '—'}°</small></strong><b>{description}</b><small>Valid {timeLabel(recordValue(item.valid_period, 'start'))}–{timeLabel(recordValue(item.valid_period, 'end'))}</small></div><span className="weather-symbol" aria-hidden="true">{forecastSymbol(description)}</span></div>
    <div className="forecast-summary"><span><small>Humidity</small><strong>{humidity.low ?? '—'}–{humidity.high ?? '—'}%</strong></span><span><small>Wind</small><strong>{windSpeed.low ?? '—'}–{windSpeed.high ?? '—'} km/h</strong></span><span><small>Direction</small><strong>{previewValue(wind.direction)}</strong></span></div>
    <div className="forecast-periods">{periods.map((period, index) => {
      const regions = isRecord(period.regions) ? period.regions : {}
      return <article key={`${timeLabel(recordValue(period.time, 'start'))}-${index}`}><div><strong>{timeLabel(recordValue(period.time, 'start'))}–{timeLabel(recordValue(period.time, 'end'))}</strong><small>Regional outlook</small></div><ul>{Object.entries(regions).map(([region, forecast]) => <li key={region}><span>{previewLabel(region)}</span><b>{previewValue(forecast)}</b></li>)}</ul></article>
    })}</div>
  </div>
}

export function AreaForecastPreview({ data }: { data: unknown }) {
  const item = firstResponseItem(data)
  const forecasts = item && Array.isArray(item.forecasts) ? item.forecasts.filter(isRecord) : []
  if (!item || !forecasts.length) return <div className="weather-empty"><strong>Area forecast unavailable</strong><span>No neighbourhood forecasts were returned.</span></div>
  const counts = new Map<string, number>()
  forecasts.forEach((forecast) => {
    const description = cleanText(forecast.forecast) ?? 'Unknown'
    counts.set(description, (counts.get(description) ?? 0) + 1)
  })
  const dominant = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  return <div className="weather-preview area-forecast-preview" data-weather-view="area-forecast">
    <div className="area-forecast-summary"><div><span>Singapore neighbourhoods</span><strong>{forecasts.length}</strong><b>areas reporting</b><small>Valid {timeLabel(recordValue(item.valid_period, 'start'))}–{timeLabel(recordValue(item.valid_period, 'end'))}</small></div><div><span aria-hidden="true">{forecastSymbol(dominant?.[0])}</span><strong>{dominant?.[0] ?? 'Current outlook'}</strong><small>{dominant?.[1] ?? 0} areas</small></div></div>
    <div className="area-forecast-grid">{forecasts.slice(0, 12).map((forecast, index) => <article key={`${forecast.area}-${index}`}><span aria-hidden="true">{forecastSymbol(cleanText(forecast.forecast))}</span><div><strong>{previewValue(forecast.area)}</strong><small>{previewValue(forecast.forecast)}</small></div></article>)}</div>
  </div>
}

export function StationReadingsPreview({ data, api }: { data: unknown; api: ApiDemo }) {
  const root = isRecord(data) ? data : {}
  const metadata = isRecord(root.metadata) ? root.metadata : {}
  const item = firstResponseItem(data)
  const readings = item && Array.isArray(item.readings) ? item.readings.filter(isRecord) : []
  const stations = Array.isArray(metadata.stations) ? metadata.stations.filter(isRecord) : []
  const stationById = new Map(stations.map((station) => [textValue(station.id) ?? '', station]))
  const values = readings.map((reading) => numberValue(reading.value)).filter((value): value is number => value !== undefined)
  if (!readings.length || !values.length) return <div className="weather-empty"><strong>Station readings unavailable</strong><span>No measurement values were returned.</span></div>
  const measurement = measurementMeta(api)
  const metadataUnit = textValue(metadata.reading_unit)?.replace('deg C', '°C')
  const unit = metadataUnit ?? measurement.unit?.trim() ?? ''
  const average = values.reduce((sum, value) => sum + value, 0) / values.length
  return <div className="weather-preview station-readings-preview" data-weather-view="station-readings">
    <div className="station-summary"><div><span>{measurement.label}</span><strong>{formatNumber(average)}{unit}</strong><b>Network average</b><small>{values.length} active station{values.length === 1 ? '' : 's'} · {timeLabel(item?.timestamp)}</small></div><dl><div><dt>Lowest</dt><dd>{formatNumber(Math.min(...values))}{unit}</dd></div><div><dt>Highest</dt><dd>{formatNumber(Math.max(...values))}{unit}</dd></div><div><dt>Updated</dt><dd>{timeLabel(item?.timestamp)}</dd></div></dl></div>
    <div className="station-list">{readings.slice(0, 8).map((reading, index) => {
      const station = stationById.get(textValue(reading.station_id) ?? '')
      return <article key={`${reading.station_id}-${index}`}><span>{textValue(reading.station_id) ?? index + 1}</span><div><strong>{textValue(station?.name) ?? 'Weather station'}</strong><small>{station && isRecord(station.location) ? `${previewValue(station.location.latitude)}, ${previewValue(station.location.longitude)}` : 'Singapore sensor network'}</small></div><b>{previewValue(reading.value)}{unit}</b></article>
    })}</div>
  </div>
}

export function RegionalAirQualityPreview({ data, api }: { data: unknown; api: ApiDemo }) {
  const item = firstResponseItem(data)
  const readings = item && isRecord(item.readings) ? item.readings : {}
  const preferredKey = api.id === 'data-gov-psi' ? 'psi_twenty_four_hourly' : 'pm25_one_hourly'
  let regional = isRecord(readings[preferredKey]) ? readings[preferredKey] : undefined
  if (!regional) regional = Object.values(readings).find((value) => isRecord(value) && Object.values(value).some((reading) => numberValue(reading) !== undefined)) as Record<string, unknown> | undefined
  const regions = regional ? Object.entries(regional).map(([name, value]) => ({ name, value: numberValue(value) })).filter((entry): entry is { name: string; value: number } => entry.value !== undefined) : []
  if (!regions.length) return <div className="weather-empty"><strong>Regional readings unavailable</strong><span>No regional air-quality values were returned.</span></div>
  const max = Math.max(...regions.map((region) => region.value))
  const average = regions.reduce((sum, region) => sum + region.value, 0) / regions.length
  const unit = api.id === 'data-gov-psi' ? 'PSI' : 'µg/m³'
  const status = api.id === 'data-gov-psi' ? max <= 50 ? 'Good' : max <= 100 ? 'Moderate' : 'Elevated' : max <= 12 ? 'Low' : max <= 35 ? 'Moderate' : 'Elevated'
  return <div className="weather-preview regional-air-preview" data-weather-view="regional-air-quality">
    <div className="air-quality-summary"><div><span>Singapore air quality</span><strong>{formatNumber(average)}</strong><b>{unit} regional average</b><small>Updated {timeLabel(item?.update_timestamp ?? item?.timestamp)}</small></div><em className={status.toLowerCase()}>{status}</em></div>
    <div className="regional-reading-grid">{regions.map((region) => <article key={region.name}><span>{previewLabel(region.name)}</span><strong>{formatNumber(region.value)}</strong><small>{unit}</small><i style={{ '--reading-level': `${Math.min(100, (region.value / Math.max(max, 1)) * 100)}%` } as CSSProperties}/></article>)}</div>
  </div>
}

export function AirQualityForecastPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const current = isRecord(root.current) ? root.current : {}
  const units = isRecord(root.current_units) ? root.current_units : {}
  const aqi = numberValue(current.us_aqi)
  if (aqi === undefined) return <div className="weather-empty"><strong>Air-quality reading unavailable</strong><span>The response did not include a current U.S. AQI value.</span></div>
  const status = aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : aqi <= 150 ? 'Sensitive groups' : aqi <= 200 ? 'Unhealthy' : aqi <= 300 ? 'Very unhealthy' : 'Hazardous'
  const metrics = [
    { label: 'PM2.5', key: 'pm2_5' }, { label: 'PM10', key: 'pm10' }, { label: 'Nitrogen dioxide', key: 'nitrogen_dioxide' }, { label: 'Ozone', key: 'ozone' },
  ]
  return <div className="weather-preview global-air-preview" data-weather-view="air-quality-forecast">
    <div className="global-air-hero"><div><span>⌖ {textValue(root.timezone)?.replace('_', ' ') ?? 'Selected coordinates'}</span><strong>{formatNumber(aqi)}</strong><b>U.S. AQI · {status}</b><small>Updated {textValue(current.time)?.replace('T', ' ') ?? 'now'}</small></div><div className="air-orbit" aria-hidden="true"><i/><i/><i/></div></div>
    <div className="global-air-metrics">{metrics.map((metric) => <article key={metric.key}><small>{metric.label}</small><strong>{numberValue(current[metric.key]) === undefined ? '—' : formatNumber(numberValue(current[metric.key]) as number)}</strong><span>{textValue(units[metric.key]) ?? 'µg/m³'}</span></article>)}</div>
  </div>
}

export function UvIndexPreview({ data }: { data: unknown }) {
  const item = firstResponseItem(data)
  const indexes = item && Array.isArray(item.index) ? item.index.filter(isRecord) : []
  const latest = indexes[0]
  const value = numberValue(latest?.value)
  if (value === undefined) return <div className="weather-empty"><strong>UV reading unavailable</strong><span>No UV index values were returned.</span></div>
  const status = value < 3 ? 'Low' : value < 6 ? 'Moderate' : value < 8 ? 'High' : value < 11 ? 'Very high' : 'Extreme'
  return <div className="weather-preview uv-preview" data-weather-view="uv-index"><div className="uv-summary"><div><span>Current UV index</span><strong>{formatNumber(value)}</strong><b>{status}</b><small>Updated {timeLabel(item?.update_timestamp ?? latest.timestamp)}</small></div><div className="uv-gauge" style={{ '--uv-position': `${Math.min(100, (value / 12) * 100)}%` } as CSSProperties}><i/><span>Low</span><span>Extreme</span></div></div>{indexes.length > 1 && <div className="uv-timeline">{indexes.slice(0, 8).map((entry, index) => <article key={`${entry.timestamp}-${index}`}><span>{timeLabel(entry.timestamp)}</span><strong>{previewValue(entry.value)}</strong></article>)}</div>}</div>
}
