export const previewTitleKeys = ['name', 'title', 'label', 'commonname', 'country', 'city', 'id', 'code']
const previewCollectionKeys = ['results', 'items', 'records', 'data', 'features', 'entries', 'result', 'docs']

export const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export const previewLabel = (key: string) => key
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .split(' ')
  .filter(Boolean)
  .map((word) => ['id', 'url', 'api', 'iso', 'utc', 'gdp'].includes(word.toLowerCase()) ? word.toUpperCase() : `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
  .join(' ')

export const previewValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value)
  if (typeof value === 'string') return value.length > 90 ? `${value.slice(0, 87)}…` : value
  if (Array.isArray(value)) {
    const scalars = value.filter((item) => ['string', 'number', 'boolean'].includes(typeof item))
    return scalars.length === value.length ? scalars.slice(0, 4).map(previewValue).join(', ') : `${value.length} items`
  }
  if (isRecord(value)) {
    for (const key of ['value', 'name', 'title', 'label', 'id', 'code']) {
      if (key in value && !isRecord(value[key]) && !Array.isArray(value[key])) return previewValue(value[key])
    }
    return `${Object.keys(value).length} properties`
  }
  return String(value)
}

export const findPreviewRecords = (value: unknown, depth = 0): Array<Record<string, unknown>> => {
  if (depth > 6) return []
  if (Array.isArray(value)) {
    const directRecords = value.filter(isRecord)
    if (directRecords.length && directRecords.length === value.length) return directRecords
    for (const item of value) {
      const nested = findPreviewRecords(item, depth + 1)
      if (nested.length) return nested
    }
    return directRecords
  }
  if (!isRecord(value)) return []
  for (const key of previewCollectionKeys) {
    if (key in value) {
      const nested = findPreviewRecords(value[key], depth + 1)
      if (nested.length) return nested
    }
  }
  for (const item of Object.values(value)) {
    if (!Array.isArray(item) && !isRecord(item)) continue
    const nested = findPreviewRecords(item, depth + 1)
    if (nested.length) return nested
  }
  return depth === 0 ? [value] : []
}

const scalar = (value: unknown) => ['string', 'number', 'boolean'].includes(typeof value) ? value : undefined
export const numberValue = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : typeof value === 'string' && value.trim() && Number.isFinite(Number(value)) ? Number(value) : undefined
export const textValue = (value: unknown) => scalar(value) === undefined ? undefined : String(value)
export const recordValue = (value: unknown, key: string) => isRecord(value) ? value[key] : undefined

export const findByKey = (value: unknown, keys: string[], depth = 0): unknown => {
  if (depth > 7 || value === null || value === undefined) return undefined
  if (isRecord(value)) {
    const entry = Object.entries(value).find(([key, item]) => keys.some((candidate) => key.toLowerCase() === candidate.toLowerCase()) && scalar(item) !== undefined)
    if (entry) return entry[1]
    for (const item of Object.values(value)) {
      const found = findByKey(item, keys, depth + 1)
      if (found !== undefined) return found
    }
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findByKey(item, keys, depth + 1)
      if (found !== undefined) return found
    }
  }
  return undefined
}

export const formatNumber = (value: number, digits = 1) => new Intl.NumberFormat('en', { maximumFractionDigits: digits }).format(value)
export const compactNumber = (value: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

export const dateParts = (value: unknown) => {
  const text = textValue(value)
  if (!text) return { day: '—', weekday: 'Forecast', full: '' }
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return { day: text.slice(-2), weekday: 'Forecast', full: text }
  return {
    day: date.toLocaleDateString('en-SG', { day: '2-digit' }),
    weekday: date.toLocaleDateString('en-SG', { weekday: 'short' }),
    full: date.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' }),
  }
}

export const timeLabel = (value: unknown) => {
  const text = textValue(value)
  if (!text) return '—'
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? text : date.toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit' })
}

export const forecastSymbol = (forecast: string | undefined) => {
  const value = forecast?.toLowerCase() ?? ''
  if (value.includes('thunder')) return 'ϟ'
  if (value.includes('shower') || value.includes('rain')) return '☂'
  if (value.includes('cloud')) return '☁'
  if (value.includes('fair') || value.includes('sun') || value.includes('clear')) return '☀'
  if (value.includes('haze') || value.includes('mist')) return '≋'
  return '◒'
}

const decodeHtml = (value: string) => value.replace(/&(#x[\da-f]+|#\d+|quot|apos|amp|lt|gt);/gi, (entity, code: string) => {
  const named: Record<string, string> = { quot: '"', apos: "'", amp: '&', lt: '<', gt: '>' }
  if (code[0] !== '#') return named[code.toLowerCase()] ?? entity
  const numeric = Number.parseInt(code[1].toLowerCase() === 'x' ? code.slice(2) : code.slice(1), code[1].toLowerCase() === 'x' ? 16 : 10)
  return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : entity
})

export const cleanText = (value: unknown) => {
  const text = textValue(value)
  return text ? decodeHtml(text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()) : undefined
}

export const recordArray = (value: unknown) => Array.isArray(value) ? value.filter(isRecord) : []
export const textArray = (value: unknown) => Array.isArray(value) ? value.map(cleanText).filter((item): item is string => Boolean(item)) : []
export const epochDate = (value: unknown) => {
  const seconds = numberValue(value)
  return seconds === undefined ? undefined : new Date(seconds * 1000).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
}
