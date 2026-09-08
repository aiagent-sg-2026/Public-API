import type { ApiDemo } from '../apiCatalog'
import { Sparkline } from './ChartPrimitives'
import { cleanText, compactNumber, findByKey, findPreviewRecords, formatNumber, isRecord, numberValue, previewLabel, recordArray, recordValue, textValue } from './previewData'

type MarketSnapshot = { label: string; value: number; currency?: string; points: number[]; dates: string[]; metrics: Array<{ label: string; value: string }> }

function marketSnapshot(api: ApiDemo, data: unknown): MarketSnapshot {
  if (api.id === 'bls-timeseries' && isRecord(data)) {
    const series = recordArray(recordValue(data.Results, 'series'))[0]
    const points = recordArray(series?.data).map((entry) => numberValue(entry.value)).filter((value): value is number => value !== undefined).reverse()
    const dates = recordArray(series?.data).map((entry) => `${textValue(entry.periodName) ?? ''} ${textValue(entry.year) ?? ''}`.trim()).reverse()
    const latest = points.at(-1) ?? 0
    return {
      label: `${textValue(series?.seriesID) ?? 'BLS series'} · U.S. labor statistics`, value: latest, points, dates,
      metrics: [
        { label: 'Latest period', value: dates.at(-1) || '—' },
        { label: 'Period high', value: points.length ? formatNumber(Math.max(...points), 2) : '—' },
        { label: 'Period low', value: points.length ? formatNumber(Math.min(...points), 2) : '—' },
      ],
    }
  }
  if (api.id === 'coingecko-keyless-market' && isRecord(data)) {
    const [coinId, quote] = Object.entries(data).find(([, value]) => isRecord(value)) ?? ['Cryptocurrency', {}]
    const market = isRecord(quote) ? quote : {}
    const currencyKey = Object.keys(market).find((key) => !key.includes('_')) ?? 'usd'
    const price = numberValue(market[currencyKey]) ?? 0
    const change = numberValue(market[`${currencyKey}_24h_change`]) ?? 0
    const previous = change === -100 ? price : price / (1 + (change / 100))
    return {
      label: `${previewLabel(coinId)} · Keyless public market`, value: price, currency: currencyKey.toUpperCase(),
      points: [previous, price], dates: ['24 hours ago', 'Latest'],
      metrics: [
        { label: '24h change', value: `${change >= 0 ? '+' : ''}${formatNumber(change, 2)}%` },
        { label: 'Market cap', value: compactNumber(numberValue(market[`${currencyKey}_market_cap`]) ?? 0) },
        { label: '24h volume', value: compactNumber(numberValue(market[`${currencyKey}_24h_vol`]) ?? 0) },
      ],
    }
  }
  if (api.id === 'open-meteo-history' && isRecord(data)) {
    const daily = isRecord(data.daily) ? data.daily : {}
    const units = isRecord(data.daily_units) ? data.daily_units : {}
    const highs = Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max.map(numberValue).filter((value): value is number => value !== undefined) : []
    const lows = Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min.map(numberValue).filter((value): value is number => value !== undefined) : []
    const rain = Array.isArray(daily.precipitation_sum) ? daily.precipitation_sum.map(numberValue).filter((value): value is number => value !== undefined) : []
    const dates = Array.isArray(daily.time) ? daily.time.map((value) => textValue(value) ?? '') : []
    const latest = highs.at(-1) ?? 0
    return {
      label: `${textValue(data.timezone)?.replace(/_/g, ' ') ?? 'Historical climate'} · Daily high (${textValue(units.temperature_2m_max) ?? '°C'})`, value: latest,
      points: highs, dates,
      metrics: [
        { label: 'Average high', value: highs.length ? `${formatNumber(highs.reduce((sum, value) => sum + value, 0) / highs.length)}°` : '—' },
        { label: 'Average low', value: lows.length ? `${formatNumber(lows.reduce((sum, value) => sum + value, 0) / lows.length)}°` : '—' },
        { label: 'Total rain', value: `${formatNumber(rain.reduce((sum, value) => sum + value, 0))} ${textValue(units.precipitation_sum) ?? 'mm'}` },
      ],
    }
  }
  if (api.id === 'bank-of-canada-valet' && isRecord(data)) {
    const observations = recordArray(recordValue(data, 'observations'))
    const observedValueKeys = new Set<string>()
    observations.forEach((observation) => {
      Object.entries(observation).forEach(([key, value]) => {
        if (key === 'd' || key === 'date') return
        if (numberValue(value) !== undefined) observedValueKeys.add(key)
      })
    })
    const observedKey = [...observedValueKeys][0]
    const seriesRows = observations
      .map((observation) => ({ date: textValue(observation.d) ?? textValue(observation.date) ?? '', value: observedKey ? numberValue(observation[observedKey]) : undefined }))
      .filter((entry): entry is { date: string; value: number } => entry.value !== undefined)
    const points = seriesRows.map((entry) => entry.value)
    const dates = seriesRows.map((entry) => entry.date)
    const unit = observedKey ?? 'value'
    if (!points.length) return {
      label: 'Bank of Canada series',
      value: 0,
      points: [0],
      dates: ['No series'],
      metrics: [{ label: 'Data points', value: '0' }, { label: 'Series', value: observedKey ?? '—' }],
    }
    return {
      label: `${cleanText(recordValue(data, 'name')) ?? cleanText(recordValue(data, 'title')) ?? textValue(recordValue(data, 'series')) ?? api.name} · Bank of Canada`,
      value: points.at(-1) ?? 0, currency: unit, points: points, dates,
      metrics: [
        { label: 'Latest value', value: `${formatNumber(points.at(-1) ?? 0)} ${unit}` },
        { label: 'Series high', value: formatNumber(Math.max(...points), 4) },
        { label: 'Series low', value: formatNumber(Math.min(...points), 4) },
      ],
    }
  }
  if (api.id === 'kraken-public-ticker' && isRecord(data)) {
    const result = isRecord(data.result) ? data.result : {}
    const ticker = Object.values(result).find(isRecord) ?? {}
    const last = numberValue(Array.isArray(ticker.c) ? ticker.c[0] : undefined) ?? 0
    const open = numberValue(ticker.o) ?? last
    const low = numberValue(Array.isArray(ticker.l) ? ticker.l[1] ?? ticker.l[0] : undefined)
    const high = numberValue(Array.isArray(ticker.h) ? ticker.h[1] ?? ticker.h[0] : undefined)
    const volume = numberValue(Array.isArray(ticker.v) ? ticker.v[1] ?? ticker.v[0] : undefined)
    const bid = numberValue(Array.isArray(ticker.b) ? ticker.b[0] : undefined)
    const ask = numberValue(Array.isArray(ticker.a) ? ticker.a[0] : undefined)
    return {
      label: Object.keys(result)[0] ?? 'Kraken spot market', value: last, currency: 'USD', points: [open, low, high, last].filter((value): value is number => value !== undefined), dates: ['Open', 'Low', 'High', 'Last'],
      metrics: [
        { label: 'Bid / ask', value: `${bid === undefined ? '—' : formatNumber(bid, 2)} / ${ask === undefined ? '—' : formatNumber(ask, 2)}` },
        { label: '24h high / low', value: `${high === undefined ? '—' : formatNumber(high, 2)} / ${low === undefined ? '—' : formatNumber(low, 2)}` },
        { label: '24h volume', value: volume === undefined ? '—' : compactNumber(volume) },
      ],
    }
  }
  if (api.id === 'wikimedia-pageviews' && isRecord(data)) {
    const items = recordArray(data.items)
    const points = items.map((item) => numberValue(item.views)).filter((value): value is number => value !== undefined)
    const dates = items.map((item) => {
      const stamp = textValue(item.timestamp) ?? ''
      return stamp.length >= 8 ? `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}` : stamp
    })
    const latest = points.at(-1) ?? 0
    const total = points.reduce((sum, value) => sum + value, 0)
    return {
      label: `${textValue(items[0]?.article)?.replace(/_/g, ' ') ?? api.name} · Daily readers`, value: latest, points, dates,
      metrics: [
        { label: 'Total views', value: compactNumber(total) },
        { label: 'Daily average', value: points.length ? compactNumber(total / points.length) : '—' },
        { label: 'Peak day', value: points.length ? compactNumber(Math.max(...points)) : '—' },
      ],
    }
  }
  if (api.id === 'nasa-power-climate' && isRecord(data)) {
    const properties = isRecord(data.properties) ? data.properties : {}
    const parameterSources = isRecord(properties.parameters) ? properties.parameters : isRecord(data.parameters) ? data.parameters : {}
    const preferredKeys = ['T2M', 'T2M_MAX', 'T2M_MIN', 'RH2M', 'WS2M', 'PRECTOT']
    const selectedKey = preferredKeys.find((key) => isRecord(parameterSources[key])) ?? Object.keys(parameterSources)[0]
    const selected = selectedKey ? (isRecord(parameterSources[selectedKey]) ? parameterSources[selectedKey] : {}) : {}
    const selectedData = isRecord(selected.data) ? selected.data : isRecord(selected.values) ? selected.values : selected
    const rawSeries = isRecord(selectedData) ? Object.entries(selectedData) : []
    const series = rawSeries
      .map(([date, value]) => ({ date, value: numberValue(value) }))
      .filter((entry): entry is { date: string; value: number } => entry.value !== undefined)
      .slice(-180)
    const points = series.map((entry) => entry.value)
    const dates = series.map((entry) => entry.date)
    const latest = points.at(-1) ?? 0
    const unit = cleanText(selected.unit) || cleanText(selected.units) || 'units'
    return {
      label: `NASA POWER · ${selectedKey ?? 'climate'} · ${cleanText(selected.label) ?? 'Climate metric'}`,
      value: latest,
      currency: unit,
      points,
      dates,
      metrics: [
        { label: 'Latest value', value: `${formatNumber(latest)} ${unit}` },
        { label: 'Series length', value: String(series.length) },
        { label: 'Range', value: points.length ? `${formatNumber(Math.min(...points), 4)} – ${formatNumber(Math.max(...points), 4)}` : '—' },
      ],
    }
  }
  if (api.id === 'coinpaprika-ticker' && isRecord(data)) {
    const usd = isRecord(data.quotes) && isRecord(data.quotes.USD) ? data.quotes.USD : {}
    const price = numberValue(usd.price) ?? 0
    return { label: `${textValue(data.name) ?? api.name} · ${textValue(data.symbol) ?? ''}`, value: price, currency: 'USD', points: [price], dates: [textValue(data.last_updated) ?? 'Latest'], metrics: [['24h change', usd.percent_change_24h], ['Market cap', usd.market_cap], ['24h volume', usd.volume_24h]].map(([label, value]) => ({ label: String(label), value: numberValue(value) === undefined ? '—' : label === '24h change' ? `${formatNumber(Number(value), 2)}%` : compactNumber(Number(value)) })) }
  }
  if (api.id === 'open-meteo-ensemble' && isRecord(data)) {
    const hourly = isRecord(data.hourly) ? data.hourly : {}
    const units = isRecord(data.hourly_units) ? data.hourly_units : {}
    const baseKey = Object.keys(hourly).find((key) => key !== 'time' && !key.includes('_member'))
    const points = baseKey && Array.isArray(hourly[baseKey]) ? hourly[baseKey].map(numberValue).filter((value): value is number => value !== undefined) : []
    const dates = Array.isArray(hourly.time) ? hourly.time.map((value) => textValue(value) ?? '') : []
    const memberKeys = baseKey ? Object.keys(hourly).filter((key) => key.startsWith(`${baseKey}_member`)) : []
    const latestIndex = Math.max(0, points.length - 1)
    const latestMembers = memberKeys.map((key) => Array.isArray(hourly[key]) ? numberValue(hourly[key][latestIndex]) : undefined).filter((value): value is number => value !== undefined)
    const latest = points.at(-1) ?? latestMembers.reduce((sum, value) => sum + value, 0) / (latestMembers.length || 1)
    const unit = baseKey ? cleanText(units[baseKey]) ?? '' : ''
    return {
      label: `${cleanText(data.timezone)?.replace(/_/g, ' ') ?? 'Ensemble forecast'} · ${baseKey ? previewLabel(baseKey) : 'Forecast range'}`,
      value: latest,
      currency: unit || undefined,
      points: points.length ? points : [latest],
      dates,
      metrics: [
        { label: 'Ensemble members', value: String(memberKeys.length) },
        { label: 'Latest spread', value: latestMembers.length ? `${formatNumber(Math.min(...latestMembers), 2)} – ${formatNumber(Math.max(...latestMembers), 2)} ${unit}`.trim() : '—' },
        { label: 'Forecast points', value: String(points.length) },
      ],
    }
  }
  if (api.id === 'world-bank-indicator-explorer' && Array.isArray(data)) {
    const rows = Array.isArray(data[1]) ? data[1].filter(isRecord) : []
    const series = rows.map((row) => ({ date: textValue(row.date) ?? '', value: numberValue(row.value), row })).filter((entry): entry is { date: string; value: number; row: Record<string, unknown> } => entry.value !== undefined).sort((a, b) => Number(a.date) - Number(b.date))
    const firstRow = series[0]?.row ?? rows[0] ?? {}
    const indicator = isRecord(firstRow.indicator) ? firstRow.indicator : {}
    const country = isRecord(firstRow.country) ? firstRow.country : {}
    const points = series.map((entry) => entry.value)
    const latest = points.at(-1) ?? 0
    return {
      label: `${cleanText(indicator.value) ?? cleanText(indicator.id) ?? api.name} · ${cleanText(country.value) ?? cleanText(firstRow.countryiso3code) ?? 'Country'}`,
      value: latest,
      points: points.length ? points : [0],
      dates: series.map((entry) => entry.date),
      metrics: [
        { label: 'Latest year', value: series.at(-1)?.date ?? '—' },
        { label: 'Range', value: points.length ? `${formatNumber(Math.min(...points), 2)} – ${formatNumber(Math.max(...points), 2)}` : '—' },
        { label: 'Observations', value: String(points.length) },
      ],
    }
  }
  const records = findPreviewRecords(data)
  const rateRecords = records.map((record) => ({ record, value: numberValue(record.rate ?? record.value ?? record.close ?? record.price), date: textValue(record.date ?? record.period ?? record.year) })).filter((item): item is { record: Record<string, unknown>; value: number; date: string | undefined } => item.value !== undefined)
  const points = rateRecords.map((item) => item.value)
  const latestRecord = rateRecords.at(-1)?.record ?? records[0] ?? {}
  const latest = points.at(-1) ?? numberValue(findByKey(data, ['rate', 'value', 'price', 'close'])) ?? 0
  const pair = latestRecord.base && (latestRecord.quote || latestRecord.currency) ? `${latestRecord.base}/${latestRecord.quote ?? latestRecord.currency}` : api.name
  const series = points.length ? points : [latest]
  return {
    label: String(pair),
    value: latest,
    currency: textValue(latestRecord.quote ?? latestRecord.currency),
    points: series,
    dates: rateRecords.map((item) => item.date ?? ''),
    metrics: [
      { label: 'Period high', value: formatNumber(Math.max(...series), 4) },
      { label: 'Period low', value: formatNumber(Math.min(...series), 4) },
      { label: 'Observations', value: compactNumber(series.length) },
    ],
  }
}

export function MarketPreview({ data, api }: { data: unknown; api: ApiDemo }) {
  const snapshot = marketSnapshot(api, data)
  const first = snapshot.points[0] ?? snapshot.value
  const change = first ? ((snapshot.value - first) / Math.abs(first)) * 100 : 0
  return <div className="market-preview">
    <div className="market-summary"><div><span>{snapshot.label}</span><strong>{snapshot.currency ? `${snapshot.currency} ` : ''}{formatNumber(snapshot.value, snapshot.value < 10 ? 4 : 2)}</strong><small className={change < 0 ? 'negative' : ''}>{change < 0 ? '↓' : '↑'} {formatNumber(Math.abs(change), 2)}% across this response</small></div><div className="market-range"><span>{snapshot.dates[0] || 'First point'}</span><span>{snapshot.dates.at(-1) || 'Latest'}</span></div></div>
    <Sparkline values={snapshot.points} label="Response trend sparkline"/>
    <div className="market-metrics">{(snapshot.metrics.length ? snapshot.metrics : [{ label: 'Data points', value: String(snapshot.points.length) }]).map((metric) => <article key={metric.label}><small>{metric.label}</small><strong>{metric.value}</strong></article>)}</div>
  </div>
}
