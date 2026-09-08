import { ScorecardPreview } from './previews/ScorecardPreview'
import { GrammarPreview } from './previews/GrammarPreview'
import { RecallsPreview } from './previews/RecallsPreview'
import { DrugLabelPreview } from './previews/DrugLabelPreview'
import { FoodRecallPreview } from './previews/FoodRecallPreview'
import { PrayerTimesPreview } from './previews/PrayerTimesPreview'
import { RxNormDrugPreview } from './previews/RxNormDrugPreview'
import { TideWaterLevelPreview } from './previews/TideWaterLevelPreview'
import { ProteinAnnotationPreview } from './previews/ProteinAnnotationPreview'
import { PdbStructurePreview } from './previews/PdbStructurePreview'
import { ChemblMoleculePreview } from './previews/ChemblMoleculePreview'
import { PubChemCompoundPreview } from './previews/PubChemCompoundPreview'
import { EnsemblGenePreview } from './previews/EnsemblGenePreview'
import { AirQualityForecastPreview, AreaForecastPreview, CurrentConditionsPreview, FourDayForecastPreview, RegionalAirQualityPreview, selectWeatherPreviewVariant, StationReadingsPreview, TwentyFourHourForecastPreview, UvIndexPreview, type WeatherPreviewVariant } from './previews/WeatherPreviews'
import { FdicBankPreview, GleifLeiPreview, MempoolFeePreview, OsrmRoutePreview, RdapDomainPreview } from './previews/OperationalPreviews'
import { MarketPreview } from './previews/MarketPreviews'
import { Sparkline } from './previews/ChartPrimitives'
import { SemanticCards, type SemanticCard } from './previews/SemanticCards'
import { cleanText, compactNumber, dateParts, epochDate, findPreviewRecords, forecastSymbol, formatNumber, isRecord, numberValue, previewLabel, previewTitleKeys, previewValue, recordArray, recordValue, textArray, textValue, timeLabel } from './previews/previewData'
import './previews/diagnosticCards.css'
import { ColorPreview } from './previews/ColorPreview'
import { DnsPreview } from './previews/DnsPreview'
import { DownloadsPreview } from './previews/DownloadsPreview'
import { LifecyclePreview } from './previews/LifecyclePreview'
import { ExchangeRateApiPreview, CoinbaseRatesPreview, VatcomplyRatesPreview } from './previews/ExchangeRatesPreview'
import './previews/domainCards.css'
import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { apiCatalog, type ApiDemo } from './apiCatalog'
import { getPreviewProfile, type PreviewLayout } from './previewProfiles'

export type { PreviewLayout } from './previewProfiles'
export { selectWeatherPreviewVariant }
export type { WeatherPreviewVariant }

export type DemoPreviewItem = {
  title: string
  fields: Array<{ label: string; value: string }>
}

type MediaItem = { image: string; title: string; subtitle?: string }
type LocationPoint = { latitude: number; longitude: number; label: string; detail?: string }

export type SsotRuntimeMeta = { httpStatus: number; elapsed: number; size: number }
const formatResponseBytes = (bytes: number) => bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`

export const buildDemoPreview = (data: unknown): DemoPreviewItem[] => {
  const records = findPreviewRecords(data)
  if (!records.length) {
    if (Array.isArray(data)) return data.slice(0, 6).map((value, index) => ({ title: `Result ${index + 1}`, fields: [{ label: 'Value', value: previewValue(value) }] }))
    return [{ title: 'Response value', fields: [{ label: 'Value', value: previewValue(data) }] }]
  }
  return records.slice(0, 6).map((record, index) => {
    const entries = Object.entries(record)
    let titleEntry: [string, unknown] | undefined
    for (const preferredKey of previewTitleKeys) {
      titleEntry = entries.find(([key, value]) => key.toLowerCase() === preferredKey && ['string', 'number'].includes(typeof value))
      if (titleEntry) break
    }
    const fields = entries
      .filter(([key, value]) => key !== titleEntry?.[0] && value !== undefined)
      .slice(0, 6)
      .map(([key, value]) => ({ label: previewLabel(key), value: previewValue(value) }))
    return { title: titleEntry ? previewValue(titleEntry[1]) : `Result ${index + 1}`, fields: fields.length ? fields : [{ label: 'Value', value: previewValue(record) }] }
  })
}

export function selectPreviewLayout(api: Pick<ApiDemo, 'id' | 'category'>): PreviewLayout {
  return getPreviewProfile(api.id)?.layout ?? 'result-list'
}

function CountryPreview({ data, api }: { data: unknown; api: ApiDemo }) {
  const country = findPreviewRecords(data)[0] ?? (isRecord(data) ? data : {})
  const name = textValue(country.name) ?? 'Country profile'
  const code = textValue(country.iso2Code ?? country.id ?? country.code) ?? api.monogram
  const region = previewValue(country.region ?? 'Regional data')
  const facts = [
    ['Capital city', previewValue(country.capitalCity)],
    ['Income group', previewValue(country.incomeLevel)],
    ['Lending type', previewValue(country.lendingType)],
    ['Coordinates', country.latitude !== undefined && country.longitude !== undefined ? `${previewValue(country.latitude)}, ${previewValue(country.longitude)}` : '—'],
  ]
  return <div className="country-preview">
    <div className="country-hero"><span className="country-code">{code}</span><div><small>World profile</small><h3>{name}</h3><p><span>●</span> {region}</p></div><span className="country-globe" aria-hidden="true">◎</span></div>
    <dl className="country-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  </div>
}

function FuelPricePreview({ data }: { data: unknown }) {
  const levels = recordArray(data).filter((row) => row.series_type === 'level')
  const latest = levels[0] ?? {}
  const previous = levels[1] ?? {}
  const fuels = [
    { key: 'ron95', label: 'RON95', note: 'Market price' },
    { key: 'ron97', label: 'RON97', note: 'Premium petrol' },
    { key: 'diesel', label: 'Diesel', note: 'Peninsular Malaysia' },
    { key: 'ron95_budi95', label: 'BUDI95', note: 'Targeted price' },
  ]
  const ron95History = levels.map((row) => numberValue(row.ron95)).filter((value): value is number => value !== undefined).reverse()
  if (!levels.length) return <div className="weather-empty"><strong>Fuel-price history unavailable</strong><span>No weekly price-level rows were returned.</span></div>
  return <div className="fuel-preview">
    <header className="fuel-hero"><div><small>Official weekly price · Malaysia</small><strong>{dateParts(latest.date).full || previewValue(latest.date)}</strong><span>Ringgit Malaysia per litre</span></div><div className="fuel-pump" aria-hidden="true"><i/><b>MY</b></div></header>
    <div className="fuel-price-grid">{fuels.map((fuel) => {
      const value = numberValue(latest[fuel.key])
      const previousValue = numberValue(previous[fuel.key])
      const change = value !== undefined && previousValue !== undefined ? value - previousValue : undefined
      return <article key={fuel.key}><small>{fuel.label}</small><strong>{value === undefined ? '—' : `RM ${formatNumber(value, 2)}`}</strong><span className={change !== undefined && change < 0 ? 'down' : ''}>{change === undefined || change === 0 ? 'No weekly change' : `${change > 0 ? '↑' : '↓'} RM ${formatNumber(Math.abs(change), 2)}`}</span><em>{fuel.note}</em></article>
    })}</div>
    <div className="fuel-history"><div><small>RON95 history</small><strong>{ron95History.length} observations</strong></div><Sparkline values={ron95History} label="RON95 price history sparkline"/></div>
  </div>
}

function MarineForecastPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const hourly = isRecord(root.hourly) ? root.hourly : {}
  const units = isRecord(root.hourly_units) ? root.hourly_units : {}
  const times = Array.isArray(hourly.time) ? hourly.time.map(textValue) : []
  const offset = numberValue(root.utc_offset_seconds) ?? 0
  const now = Date.now()
  const timestamps = times.map((time) => time ? Date.parse(`${time}:00Z`) - (offset * 1000) : Number.NaN)
  const validIndexes = timestamps.map((timestamp, index) => ({ timestamp, index })).filter((entry) => Number.isFinite(entry.timestamp))
  const currentIndex = validIndexes.reduce((closest, entry) => Math.abs(entry.timestamp - now) < Math.abs(closest.timestamp - now) ? entry : closest, validIndexes[0] ?? { timestamp: now, index: 0 }).index
  const series = (key: string) => Array.isArray(hourly[key]) ? hourly[key].map(numberValue) : []
  const waveHeights = series('wave_height')
  const waveDirections = series('wave_direction')
  const wavePeriods = series('wave_period')
  const temperatures = series('sea_surface_temperature')
  const currents = series('ocean_current_velocity')
  const currentDirections = series('ocean_current_direction')
  const sampleIndexes = Array.from({ length: 8 }, (_, index) => Math.min(currentIndex + (index * 3), Math.max(0, times.length - 1))).filter((index, position, all) => all.indexOf(index) === position)
  if (!times.length) return <div className="weather-empty"><strong>Marine forecast unavailable</strong><span>No hourly marine series were returned.</span></div>
  return <div className="marine-preview">
    <div className="marine-hero"><div><small>{textValue(root.timezone)?.replace('_', ' ') ?? 'Coastal forecast'} · nearest forecast hour</small><strong>{formatNumber(waveHeights[currentIndex] ?? 0, 2)}<span>{textValue(units.wave_height) ?? 'm'}</span></strong><b>Wave height</b><p>{timeLabel(times[currentIndex])} · {formatNumber(numberValue(root.latitude) ?? 0, 3)}, {formatNumber(numberValue(root.longitude) ?? 0, 3)}</p></div><div className="marine-compass" style={{ '--marine-bearing': `${waveDirections[currentIndex] ?? 0}deg` } as CSSProperties}><i>↑</i><span>N</span><b>{formatNumber(waveDirections[currentIndex] ?? 0, 0)}°</b></div></div>
    <div className="marine-metrics">
      <article><small>Wave period</small><strong>{formatNumber(wavePeriods[currentIndex] ?? 0, 1)} {textValue(units.wave_period) ?? 's'}</strong><span>Energy interval</span></article>
      <article><small>Sea surface</small><strong>{formatNumber(temperatures[currentIndex] ?? 0, 1)}{textValue(units.sea_surface_temperature) ?? '°C'}</strong><span>Water temperature</span></article>
      <article><small>Ocean current</small><strong>{formatNumber(currents[currentIndex] ?? 0, 1)} {textValue(units.ocean_current_velocity) ?? 'km/h'}</strong><span>{formatNumber(currentDirections[currentIndex] ?? 0, 0)}° bearing</span></article>
    </div>
    <div className="marine-timeline">{sampleIndexes.map((index) => <article key={`${times[index]}-${index}`}><time>{timeLabel(times[index])}</time><i style={{ '--wave-height': `${Math.min(100, ((waveHeights[index] ?? 0) / Math.max(...waveHeights.filter((value): value is number => value !== undefined), 1)) * 100)}%` } as CSSProperties}/><strong>{formatNumber(waveHeights[index] ?? 0, 2)} m</strong><small>{dateParts(times[index]).full}</small></article>)}</div>
    <p className="marine-disclaimer">Forecast guidance only · Not for navigation or safety-critical decisions</p>
  </div>
}

function NobelPrizePreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const prizes = recordArray(root.nobelPrizes)
  if (!prizes.length) return <div className="weather-empty"><strong>Nobel Prize records unavailable</strong><span>No prize records were returned.</span></div>
  const first = prizes[0]
  const firstCategory = isRecord(first.category) ? cleanText(first.category.en) : undefined
  const laureateCount = prizes.reduce((total, prize) => total + recordArray(prize.laureates).length, 0)
  return <div className="nobel-preview">
    <div className="nobel-summary"><span aria-hidden="true">N</span><div><small>Latest {firstCategory ?? 'Nobel'} awards</small><strong>{prizes.length} prize years</strong><p>{laureateCount} laureates represented in this response</p></div><b>{previewValue(first.awardYear)}</b></div>
    <ol className="nobel-timeline">{prizes.slice(0, 6).map((prize, index) => {
      const category = isRecord(prize.category) ? cleanText(prize.category.en) : 'Nobel Prize'
      const laureates = recordArray(prize.laureates)
      return <li key={`${prize.awardYear}-${index}`}><time>{previewValue(prize.awardYear)}</time><i/><article><header><small>{category}</small><b>{compactNumber(numberValue(prize.prizeAmount) ?? 0)} SEK</b></header><h3>{laureates.map((laureate) => cleanText(recordValue(laureate.knownName, 'en') ?? recordValue(laureate.fullName, 'en'))).filter(Boolean).join(' · ') || 'Prize organization'}</h3><p>{cleanText(recordValue(laureates[0]?.motivation, 'en')) ?? 'Official prize record and laureate information.'}</p></article></li>
    })}</ol>
  </div>
}

function LichessLeaderboardPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const cards: SemanticCard[] = recordArray(root.users).map((user, index) => {
    const perfs = isRecord(user.perfs) ? user.perfs : {}
    const perf = Object.values(perfs).find(isRecord) ?? {}
    return {
      title: cleanText(user.username) ?? `Player ${index + 1}`,
      eyebrow: cleanText(user.title) ?? 'Lichess player',
      badge: `Rating ${previewValue(perf.rating)}`,
      metrics: [
        { label: 'Rank', value: String(index + 1) },
        { label: 'Progress', value: previewValue(perf.progress) },
        { label: 'Patron', value: user.patron ? 'Yes' : 'No' },
      ],
    }
  })
  return <SemanticCards cards={cards} emptyTitle="Lichess leaderboard unavailable"/>
}

function ChessRatingsPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const modes = [
    { key: 'chess_blitz', label: 'Blitz', symbol: '⚡' },
    { key: 'chess_bullet', label: 'Bullet', symbol: '●' },
    { key: 'chess_rapid', label: 'Rapid', symbol: '◷' },
    { key: 'chess_daily', label: 'Daily', symbol: '□' },
  ].map((mode) => {
    const stats = isRecord(root[mode.key]) ? root[mode.key] as Record<string, unknown> : {}
    const last = isRecord(stats.last) ? stats.last : {}
    const best = isRecord(stats.best) ? stats.best : {}
    const record = isRecord(stats.record) ? stats.record : {}
    return { ...mode, rating: numberValue(last.rating), best: numberValue(best.rating), wins: numberValue(record.win) ?? 0, losses: numberValue(record.loss) ?? 0, draws: numberValue(record.draw) ?? 0 }
  }).filter((mode) => mode.rating !== undefined)
  if (!modes.length) return <div className="weather-empty"><strong>Chess ratings unavailable</strong><span>The player has no public rating records.</span></div>
  const leader = [...modes].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0]
  const totalGames = modes.reduce((total, mode) => total + mode.wins + mode.losses + mode.draws, 0)
  return <div className="chess-preview">
    <header className="chess-hero"><div className="chess-board" aria-hidden="true">♞</div><div><small>Public competitive profile</small><strong>{formatNumber(leader.rating ?? 0, 0)}</strong><span>Highest current rating · {leader.label}</span></div><div><small>FIDE</small><b>{previewValue(root.fide)}</b><span>{compactNumber(totalGames)} recorded games</span></div></header>
    <div className="chess-rating-grid">{modes.map((mode) => {
      const games = mode.wins + mode.losses + mode.draws
      const winRate = games ? (mode.wins / games) * 100 : 0
      return <article key={mode.key}><header><span>{mode.symbol}</span><div><small>{mode.label}</small><strong>{formatNumber(mode.rating ?? 0, 0)}</strong></div><b>Best {formatNumber(mode.best ?? mode.rating ?? 0, 0)}</b></header><div className="chess-score"><i style={{ '--win-rate': `${winRate}%` } as CSSProperties}/></div><dl><div><dt>Win</dt><dd>{compactNumber(mode.wins)}</dd></div><div><dt>Draw</dt><dd>{compactNumber(mode.draws)}</dd></div><div><dt>Loss</dt><dd>{compactNumber(mode.losses)}</dd></div></dl></article>
    })}</div>
  </div>
}

function CrossrefWorksPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const message = isRecord(root.message) ? root.message : {}
  const works = recordArray(message.items)
  if (!works.length) return <div className="weather-empty"><strong>Scholarly works unavailable</strong><span>No Crossref work records were returned.</span></div>
  return <div className="crossref-preview">
    <header><div><small>Crossref scholarly index</small><strong>{compactNumber(numberValue(message['total-results']) ?? works.length)} matching works</strong></div><span>{works.length} shown</span></header>
    <ol>{works.slice(0, 8).map((work, index) => {
      const authors = recordArray(work.author).map((author) => [cleanText(author.given), cleanText(author.family)].filter(Boolean).join(' ')).filter(Boolean)
      const published = isRecord(work.published) && Array.isArray(work.published['date-parts']) && Array.isArray(work.published['date-parts'][0]) ? previewValue(work.published['date-parts'][0][0]) : '—'
      return <li key={`${work.DOI}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><article><header><small>{previewLabel(cleanText(work.type) ?? 'Scholarly work')} · {published}</small><b>{compactNumber(numberValue(work['is-referenced-by-count']) ?? 0)} citations</b></header><h3>{textArray(work.title)[0] ?? 'Untitled scholarly work'}</h3><p>{authors.slice(0, 3).join(', ') || 'Authorship unavailable'} · {cleanText(work.publisher) ?? 'Publisher unavailable'}</p><code>{cleanText(work.DOI) ?? 'DOI unavailable'}</code></article></li>
    })}</ol>
  </div>
}

const collectImageUrls = (value: unknown, found: string[] = [], depth = 0): string[] => {
  if (depth > 7 || found.length >= 8) return found
  if (typeof value === 'string' && /^https?:\/\//.test(value) && /\.(?:jpe?g|png|webp)(?:\?|$)/i.test(value)) found.push(value)
  else if (Array.isArray(value)) value.forEach((item) => collectImageUrls(item, found, depth + 1))
  else if (isRecord(value)) Object.entries(value).forEach(([key, item]) => {
    if (/image|picture|photo|sprite|thumbnail/i.test(key)) collectImageUrls(item, found, depth + 1)
  })
  return [...new Set(found)]
}

function mediaItems(api: ApiDemo, data: unknown): MediaItem[] {
  if (api.id === 'internet-archive-search' && isRecord(data)) {
    const response = isRecord(data.response) ? data.response : {}
    return recordArray(response.docs).slice(0, 8).map((item) => ({
      image: typeof item.identifier === 'string' ? `https://archive.org/services/img/${item.identifier}` : '',
      title: cleanText(item.title) ?? 'Archive item',
      subtitle: `${cleanText(item.creator) ?? 'Internet Archive'} · ${previewValue(item.date)}`,
    })).filter((item) => item.image)
  }
  if (api.id === 'data-gov-traffic-images' && isRecord(data)) {
    const first = recordArray(data.items)[0]
    return recordArray(first?.cameras).slice(0, 8).map((camera, index) => ({
      image: textValue(camera.image) ?? '',
      title: `Traffic camera ${cleanText(camera.camera_id) ?? index + 1}`,
      subtitle: `${previewValue(recordValue(camera.location, 'latitude'))}, ${previewValue(recordValue(camera.location, 'longitude'))} · ${previewValue(camera.timestamp)}`,
    })).filter((item) => item.image)
  }
  if (api.id === 'pokeapi' && isRecord(data)) {
    const sprites = isRecord(data.sprites) ? data.sprites : {}
    const types = recordArray(data.types).map((entry) => cleanText(recordValue(entry.type, 'name'))).filter((value): value is string => Boolean(value))
    const image = textValue(sprites.front_default ?? sprites.front_shiny ?? sprites.back_default) ?? ''
    return image ? [{ image, title: cleanText(data.name) ?? 'Pokémon', subtitle: `${types.join(' / ') || 'Pokémon'} · #${previewValue(data.id)}` }] : []
  }
  if (api.id === 'tvmaze-search') return recordArray(data).slice(0, 8).map((entry) => {
    const show = isRecord(entry.show) ? entry.show : {}
    const image = isRecord(show.image) ? show.image : {}
    const rating = isRecord(show.rating) ? show.rating : {}
    return {
      image: textValue(image.medium ?? image.original) ?? '',
      title: cleanText(show.name) ?? 'TV show',
      subtitle: `${cleanText(show.status) ?? 'Series'} · ★ ${previewValue(rating.average)} · ${textArray(show.genres).slice(0, 2).join(', ') || 'TV'}`,
    }
  }).filter((item) => item.image)
  if (api.id === 'open-food-facts' && isRecord(data)) {
    const product = isRecord(data.product) ? data.product : {}
    const image = textValue(product.image_front_url ?? product.image_url ?? product.image_front_small_url) ?? ''
    return image ? [{
      image,
      title: cleanText(product.product_name ?? product.abbreviated_product_name) ?? 'Food product',
      subtitle: `${cleanText(product.brands) ?? 'Open Food Facts'} · Nutri-Score ${previewValue(product.nutriscore_grade).toUpperCase()}`,
    }] : []
  }
  if (api.id === 'flathub-appstream' && isRecord(data)) {
    const screenshots = recordArray(data.screenshots)
    const items = screenshots.slice(0, 6).map((shot, index) => {
      const sizes = recordArray(shot.sizes)
      const preferred = sizes.find((size) => numberValue(size.width) !== undefined && (numberValue(size.width) ?? 0) >= 500) ?? sizes[0]
      return {
        image: textValue(preferred?.src) ?? '',
        title: cleanText(shot.caption) ?? `${cleanText(data.name) ?? 'Flathub app'} screenshot ${index + 1}`,
        subtitle: `${cleanText(data.developer_name) ?? 'Flathub'} · ${cleanText(data.project_license) ?? 'License available'}`,
      }
    }).filter((item) => item.image)
    if (items.length) return items
    const icon = textValue(data.icon) ?? ''
    return icon ? [{ image: icon, title: cleanText(data.name) ?? cleanText(data.id) ?? 'Flathub app', subtitle: cleanText(data.summary) }] : []
  }
  if (api.id === 'vam-collections' && isRecord(data)) return recordArray(data.records).slice(0, 8).map((record) => {
    const images = isRecord(record._images) ? record._images : {}
    const maker = isRecord(record._primaryMaker) ? record._primaryMaker : {}
    return {
      image: textValue(images._primary_thumbnail) ?? '',
      title: cleanText(record._primaryTitle) ?? cleanText(record.objectType) ?? 'V&A object',
      subtitle: `${cleanText(maker.name) ?? cleanText(record._primaryPlace) ?? 'V&A'} · ${cleanText(record._primaryDate) ?? previewValue(record.accessionNumber)}`,
    }
  }).filter((item) => item.image)
  if (api.id === 'randomfox-photo' && isRecord(data)) return textValue(data.image) ? [{ image: textValue(data.image) ?? '', title: 'Random fox', subtitle: 'randomfox.ca' }] : []
  if (api.id === 'cleveland-museum-search' && isRecord(data)) return recordArray(data.data).slice(0, 8).map((artwork) => {
    const images = isRecord(artwork.images) ? artwork.images : {}
    const web = isRecord(images.web) ? images.web : {}
    const creators = recordArray(artwork.creators).map((creator) => cleanText(creator.description)).filter((value): value is string => Boolean(value))
    return { image: textValue(web.url) ?? '', title: cleanText(artwork.title) ?? 'Artwork', subtitle: creators.join(', ') || cleanText(artwork.creation_date) }
  }).filter((item) => item.image)
  if (api.id === 'scryfall-card-search' && isRecord(data)) return recordArray(data.data).slice(0, 8).map((card) => {
    const images = isRecord(card.image_uris) ? card.image_uris : {}
    return { image: textValue(images.normal ?? images.large) ?? '', title: cleanText(card.name) ?? 'Card', subtitle: `${cleanText(card.type_line) ?? 'Card'} · ${cleanText(card.set_name) ?? 'Magic: The Gathering'}` }
  }).filter((item) => item.image)
  if (api.id === 'dogs' && isRecord(data) && Array.isArray(data.message)) return data.message.filter((item): item is string => typeof item === 'string').slice(0, 6).map((image, index) => ({ image, title: `Dog ${index + 1}`, subtitle: 'Random Dog gallery' }))
  if (api.id === 'people' && isRecord(data) && Array.isArray(data.results)) return data.results.filter(isRecord).slice(0, 6).map((person, index) => ({ image: textValue(recordValue(person.picture, 'large') ?? recordValue(person.picture, 'medium')) ?? '', title: isRecord(person.name) ? `${textValue(person.name.first) ?? ''} ${textValue(person.name.last) ?? ''}`.trim() : `Person ${index + 1}`, subtitle: textValue(person.email) })).filter((item) => item.image)
  if (api.id === 'wikipedia-search' && isRecord(data)) {
    const query = isRecord(data.query) ? data.query : {}
    const pages = isRecord(query.pages) ? Object.values(query.pages).filter(isRecord) : []
    return pages.slice(0, 8).map((page) => ({
      image: textValue(recordValue(page.thumbnail, 'source')) ?? '',
      title: cleanText(page.title) ?? 'Wikipedia article',
      subtitle: cleanText(page.extract) ?? `Page ID ${previewValue(page.pageid)}`,
    })).filter((item) => item.image)
  }
  if (api.id === 'rick-morty-characters' && isRecord(data)) return recordArray(data.results).slice(0, 8).map((character) => ({
    image: textValue(character.image) ?? '',
    title: cleanText(character.name) ?? 'Character',
    subtitle: `${previewValue(character.status)} · ${previewValue(character.species)} · ${previewValue(recordValue(character.location, 'name'))}`,
  })).filter((item) => item.image)
  if (api.id === 'spaceflight-news' && isRecord(data)) return recordArray(data.results).slice(0, 8).map((article) => ({
    image: textValue(article.image_url) ?? '',
    title: cleanText(article.title) ?? 'Spaceflight report',
    subtitle: `${cleanText(article.news_site) ?? 'Spaceflight News'} · ${dateParts(article.published_at).full || 'Recently published'}`,
  })).filter((item) => item.image)
  if (api.id === 'dummyjson-recipes' && isRecord(data)) return recordArray(data.recipes).slice(0, 8).map((recipe) => ({
    image: textValue(recipe.image) ?? '',
    title: cleanText(recipe.name) ?? 'Recipe',
    subtitle: `${cleanText(recipe.cuisine) ?? 'Global cuisine'} · ★ ${previewValue(recipe.rating)} · ${previewValue(recipe.difficulty)}`,
  })).filter((item) => item.image)
  if (api.id === 'nasa-image-search' && isRecord(data)) {
    const collection = isRecord(data.collection) ? data.collection : {}
    return recordArray(collection.items).slice(0, 8).map((item) => {
      const itemData = Array.isArray(item.data) ? item.data.find(isRecord) : undefined
      const links = Array.isArray(item.links) ? item.links.filter(isRecord) : []
      const thumbnail = links.find((link) => link.rel === 'preview') ?? links[0]
      return { image: textValue(thumbnail?.href) ?? '', title: cleanText(itemData?.title) ?? 'NASA media item', subtitle: cleanText(itemData?.description) }
    }).filter((item) => item.image)
  }
  if (api.id === 'inaturalist-observations' && isRecord(data)) return recordArray(data.results).slice(0, 8).map((observation) => {
    const taxon = isRecord(observation.taxon) ? observation.taxon : {}
    const photos = Array.isArray(observation.photos) ? observation.photos.filter(isRecord) : []
    return {
      image: textValue(photos[0]?.url) ?? '',
      title: cleanText(taxon.preferred_common_name) ?? cleanText(taxon.name) ?? 'Species observation',
      subtitle: `${cleanText(observation.place_guess) ?? 'Location unavailable'} · ${previewValue(observation.observed_on)}`,
    }
  }).filter((item) => item.image)
  if (api.id === 'wikimedia-commons-search' && isRecord(data)) {
    const query = isRecord(data.query) ? data.query : {}
    const pages = isRecord(query.pages) ? Object.values(query.pages).filter(isRecord) : []
    return pages.slice(0, 8).map((page) => {
      const imageInfo = recordArray(page.imageinfo)[0] ?? {}
      const metadata = isRecord(imageInfo.extmetadata) ? imageInfo.extmetadata : {}
      const license = cleanText(recordValue(metadata.LicenseShortName, 'value')) ?? cleanText(recordValue(metadata.License, 'value'))
      return {
        image: textValue(imageInfo.thumburl) ?? textValue(imageInfo.url) ?? '',
        title: (cleanText(page.title) ?? 'Commons media').replace(/^File:/, ''),
        subtitle: license ? `Wikimedia Commons · ${license}` : 'Wikimedia Commons',
      }
    }).filter((item) => item.image)
  }
  if (api.id === 'openverse-search' && isRecord(data)) return recordArray(data.results).slice(0, 8).map((item) => {
    const thumbnails = isRecord(item.thumbnail) ? item.thumbnail : {}
    return {
      image: textValue(item.thumbnail) ?? textValue(item.thumbnail_url) ?? textValue(thumbnails.url) ?? textValue(item.thumbnailUrl) ?? textValue(item.url) ?? '',
      title: cleanText(item.title) ?? cleanText(item.name) ?? cleanText(item.id) ?? 'Openverse result',
      subtitle: `${cleanText(item.creator) ?? cleanText(item.creator_name) ?? 'Openverse'} · ${cleanText(item.license) ?? cleanText(item.license_title) ?? 'Public license'}`,
    }
  }).filter((item) => item.image)
  if (api.id === 'apple-itunes-search' && isRecord(data)) return recordArray(data.results).slice(0, 8).map((item) => ({
    image: textValue(item.artworkUrl100) ?? textValue(item.artworkUrl60) ?? '',
    title: cleanText(item.trackName) ?? cleanText(item.collectionName) ?? cleanText(item.artistName) ?? 'Apple media item',
    subtitle: [cleanText(item.artistName), cleanText(item.wrapperType) ?? cleanText(item.kind)].filter(Boolean).join(' · ') || 'iTunes media',
  })).filter((item) => item.image)
  if (api.id === 'anilist-graphql' && isRecord(data)) {
    const root = isRecord(data.data) ? data.data : {}
    const pageMedia = isRecord(root.Page) ? recordArray(root.Page.media) : []
    const directMedia = recordArray(root.media)
    const singleMedia = isRecord(root.Media) ? [root.Media] : []
    const media = pageMedia.length ? pageMedia : directMedia.length ? directMedia : singleMedia
    return media.slice(0, 8).map((entry) => {
      const title = isRecord(entry.title) ? entry.title : {}
      const cover = isRecord(entry.coverImage) ? entry.coverImage : {}
      const image = textValue(cover.extraLarge ?? cover.large ?? cover.medium ?? entry.bannerImage) ?? ''
      const formattedTitle = cleanText(title.romaji ?? title.english ?? title.native ?? title.userPreferred) ?? cleanText(entry.name) ?? 'Anime or manga title'
      const status = cleanText(entry.status) ?? ''
      const type = cleanText(entry.type) || cleanText(entry.format) || 'Media'
      const release = textValue(entry.startDate) ?? previewValue(entry.seasonYear) ?? previewValue(entry.startYear)
      const chapters = entry.chapters !== undefined ? `${previewValue(entry.chapters)} ch` : (entry.episodes !== undefined ? `${previewValue(entry.episodes)} ep` : undefined)
      const description = [type, release, chapters, status].filter(Boolean).join(' · ')
      return { image, title: formattedTitle, subtitle: description || cleanText(title.native) || type }
    }).filter((item) => item.image)
  }
  if (api.id === 'art-institute-search' && isRecord(data)) {
    const base = isRecord(data.config) ? textValue(data.config.iiif_url) : undefined
    if (base && Array.isArray(data.data)) return data.data.filter(isRecord).filter((item) => item.image_id).slice(0, 6).map((item) => ({ image: `${base}/2/${item.image_id}/full/500,/0/default.jpg`, title: textValue(item.title) ?? 'Artwork', subtitle: textValue(item.artist_title) }))
  }
  const records = findPreviewRecords(data)
  const urls = collectImageUrls(data)
  return urls.slice(0, 6).map((image, index) => {
    const record = records[index] ?? records[0] ?? {}
    const nested = isRecord(record.show) ? record.show : isRecord(record.product) ? record.product : record
    return { image, title: textValue(nested.name ?? nested.title ?? nested.product_name) ?? `${api.name} ${index + 1}`, subtitle: cleanText(nested.artist_title ?? nested.email ?? nested.summary ?? nested.brands) }
  })
}

function MediaGalleryPreview({ data, api }: { data: unknown; api: ApiDemo }) {
  const items = mediaItems(api, data)
  if (!items.length) return <ResultListPreview data={data} api={api}/>
  return <div className={`media-preview ${items.length === 1 ? 'single' : ''}`}>{items.map((item, index) => {
    const subtitleNodes: ReactNode[] = []
    item.subtitle?.split(' · ').forEach((part, partIndex) => {
      if (partIndex > 0) subtitleNodes.push(' · ')
      subtitleNodes.push(<span key={`${part}-${partIndex}`}>{part}</span>)
    })
    return <article key={`${item.image}-${index}`}><img src={item.image} alt={item.title} loading="lazy"/><div><small>{api.category}</small><h3>{item.title}</h3>{subtitleNodes.length ? <p>{subtitleNodes}</p> : null}</div></article>
  })}</div>
}

function locationPoints(data: unknown, api?: Pick<ApiDemo, 'id'>): LocationPoint[] {
  if (api?.id === 'brasilapi-postcode' && isRecord(data)) {
    const location = isRecord(data.location) ? data.location : {}
    const coordinates = isRecord(location.coordinates) ? location.coordinates : {}
    const latitude = numberValue(coordinates.latitude)
    const longitude = numberValue(coordinates.longitude)
    if (latitude === undefined || longitude === undefined) return []
    return [{
      latitude,
      longitude,
      label: [cleanText(data.street), cleanText(data.neighborhood)].filter(Boolean).join(' · ') || cleanText(data.cep) || 'Brazilian postcode',
      detail: `${cleanText(data.city) ?? 'City'} · ${cleanText(data.state) ?? 'State'} · ${cleanText(data.timezoneName) ?? 'Brazil'}`,
    }]
  }
  if (api?.id === 'citybikes-network' && isRecord(data)) {
    const network = isRecord(data.network) ? data.network : {}
    return recordArray(network.stations).slice(0, 8).map((station, index) => {
      const extra = isRecord(station.extra) ? station.extra : {}
      const english = isRecord(extra.en) ? extra.en : {}
      return {
        latitude: numberValue(station.latitude) ?? 0,
        longitude: numberValue(station.longitude) ?? 0,
        label: cleanText(english.name) ?? cleanText(station.name) ?? `Bike station ${index + 1}`,
        detail: `${previewValue(station.free_bikes)} bikes · ${previewValue(station.empty_slots)} empty docks`,
      }
    }).filter((point) => point.latitude !== 0 || point.longitude !== 0)
  }
  if (api?.id === 'nominatim-search') return recordArray(data).slice(0, 8).map((place, index) => ({
    latitude: numberValue(place.lat) ?? 0,
    longitude: numberValue(place.lon) ?? 0,
    label: cleanText(place.name) ?? cleanText(place.display_name) ?? `Place ${index + 1}`,
    detail: `${previewLabel(cleanText(place.type) ?? 'Place')} · ${cleanText(place.display_name) ?? 'OpenStreetMap result'}`,
  })).filter((point) => point.latitude !== 0 || point.longitude !== 0)
  if (api?.id === 'gbif-occurrence-search' && isRecord(data)) return recordArray(data.results).slice(0, 8).map((occurrence, index) => ({
    latitude: numberValue(occurrence.decimalLatitude) ?? 0,
    longitude: numberValue(occurrence.decimalLongitude) ?? 0,
    label: cleanText(occurrence.scientificName) ?? cleanText(occurrence.species) ?? `Occurrence ${index + 1}`,
    detail: `${cleanText(occurrence.locality) ?? cleanText(occurrence.stateProvince) ?? cleanText(occurrence.country) ?? 'Locality unavailable'} · ${previewValue(occurrence.eventDate ?? occurrence.year)}`,
  })).filter((point) => point.latitude !== 0 || point.longitude !== 0)
  if (api?.id === 'data-gov-taxi' && isRecord(data)) {
    const feature = recordArray(data.features)[0]
    const geometry = feature && isRecord(feature.geometry) ? feature.geometry : {}
    const coordinates = Array.isArray(geometry.coordinates) ? geometry.coordinates : []
    return coordinates.filter((entry): entry is unknown[] => Array.isArray(entry) && entry.length >= 2).slice(0, 8).map((entry, index) => ({
      latitude: numberValue(entry[1]) ?? 0,
      longitude: numberValue(entry[0]) ?? 0,
      label: `Available taxi ${index + 1}`,
      detail: `${formatNumber(numberValue(entry[1]) ?? 0, 4)}, ${formatNumber(numberValue(entry[0]) ?? 0, 4)}`,
    })).filter((point) => point.latitude !== 0 || point.longitude !== 0)
  }
  if (api?.id === 'usgs' && isRecord(data)) return recordArray(data.features).slice(0, 8).map((feature, index) => {
    const geometry = isRecord(feature.geometry) ? feature.geometry : {}
    const coordinates = Array.isArray(geometry.coordinates) ? geometry.coordinates : []
    const properties = isRecord(feature.properties) ? feature.properties : {}
    return {
      latitude: numberValue(coordinates[1]) ?? 0,
      longitude: numberValue(coordinates[0]) ?? 0,
      label: cleanText(properties.title) ?? cleanText(properties.place) ?? `Earthquake ${index + 1}`,
      detail: `Magnitude ${previewValue(properties.mag)} · ${cleanText(properties.status) ?? 'USGS'}`,
    }
  }).filter((point) => point.latitude !== 0 || point.longitude !== 0)
  if (api?.id === 'uk-police-street-crime') return recordArray(data).slice(0, 8).map((crime, index) => {
    const location = isRecord(crime.location) ? crime.location : {}
    const street = isRecord(location.street) ? location.street : {}
    return {
      latitude: numberValue(location.latitude) ?? 0,
      longitude: numberValue(location.longitude) ?? 0,
      label: cleanText(street.name) ?? `Anonymised location ${index + 1}`,
      detail: `${previewLabel(cleanText(crime.category) ?? 'Street crime')} · ${previewValue(crime.month)}`,
    }
  }).filter((point) => point.latitude !== 0 || point.longitude !== 0)
  if (api?.id === 'open-brewery-directory') return recordArray(data).slice(0, 8).map((brewery, index) => ({
    latitude: numberValue(brewery.latitude) ?? 0,
    longitude: numberValue(brewery.longitude) ?? 0,
    label: cleanText(brewery.name) ?? `Brewery ${index + 1}`,
    detail: `${previewLabel(cleanText(brewery.brewery_type) ?? 'Brewery')} · ${cleanText(brewery.city) ?? cleanText(brewery.country) ?? 'Location available'}`,
  })).filter((point) => point.latitude !== 0 || point.longitude !== 0)
  if (api?.id === 'zippopotam-postcode') return (isRecord(data) ? recordArray(data.places) : []).slice(0, 8).map((place, index) => {
    return {
      latitude: numberValue(place.latitude) ?? 0,
      longitude: numberValue(place.longitude) ?? 0,
      label: cleanText(place['place name']) ?? `Postcode place ${index + 1}`,
      detail: `${cleanText(place.state) ?? cleanText(place['state abbreviation']) ?? 'Location'} · ${cleanText(recordValue(data, 'country')) ?? 'Postcode lookup'}`,
    }
  }).filter((point) => point.latitude !== 0 || point.longitude !== 0)
  const points: LocationPoint[] = []
  const visit = (value: unknown, depth = 0) => {
    if (depth > 7 || points.length >= 8) return
    if (isRecord(value)) {
      const geometry = isRecord(value.geometry) ? value.geometry : undefined
      const coordinates = geometry && Array.isArray(geometry.coordinates) ? geometry.coordinates : undefined
      const latitude = numberValue(value.latitude ?? value.lat ?? (coordinates && coordinates.length >= 2 ? coordinates[1] : undefined))
      const longitude = numberValue(value.longitude ?? value.lon ?? value.lng ?? (coordinates && coordinates.length >= 2 ? coordinates[0] : undefined))
      if (latitude !== undefined && longitude !== undefined) {
        const properties = isRecord(value.properties) ? value.properties : value
        points.push({ latitude, longitude, label: textValue(properties.title ?? properties.place ?? properties.name ?? properties.camera_id ?? properties.postcode) ?? `Location ${points.length + 1}`, detail: properties.mag !== undefined ? `Magnitude ${previewValue(properties.mag)}` : undefined })
      }
      Object.values(value).forEach((item) => visit(item, depth + 1))
    } else if (Array.isArray(value)) value.forEach((item) => visit(item, depth + 1))
  }
  visit(data)
  return points
}

function LocationPreview({ data, api }: { data: unknown; api: ApiDemo }) {
  const points = locationPoints(data, api)
  if (!points.length) return <ResultListPreview data={data} api={api}/>
  const lats = points.map((point) => point.latitude)
  const lons = points.map((point) => point.longitude)
  const latMin = Math.min(...lats); const latRange = Math.max(...lats) - latMin || 1
  const lonMin = Math.min(...lons); const lonRange = Math.max(...lons) - lonMin || 1
  return <div className="location-preview"><div className="location-map" role="img" aria-label={`Map with ${points.length} response locations`}><span className="map-compass">N</span>{points.map((point, index) => <i key={`${point.latitude}-${point.longitude}-${index}`} style={{ '--point-x': `${10 + ((point.longitude - lonMin) / lonRange) * 80}%`, '--point-y': `${90 - ((point.latitude - latMin) / latRange) * 80}%` } as CSSProperties}><b>{index + 1}</b></i>)}</div><ol>{points.slice(0, 5).map((point, index) => <li key={`${point.label}-${index}`}><span>{index + 1}</span><div><strong>{point.label}</strong><small>{point.detail ?? `${formatNumber(point.latitude, 4)}, ${formatNumber(point.longitude, 4)}`}</small></div></li>)}</ol></div>
}

function CalendarPreview({ data, api }: { data: unknown; api: ApiDemo }) {
  const records = findPreviewRecords(data).slice(0, 6)
  if (!records.length) return <ResultListPreview data={data} api={api}/>
  const items: DateListItem[] = records.map((record, index) => {
    const dateText = textValue(record.date ?? record.start ?? record.datetime) ?? 'Upcoming'
    const parsed = new Date(dateText)
    const valid = !Number.isNaN(parsed.getTime())
    return {
      key: `${dateText}-${index}`,
      dateText,
      day: valid ? parsed.toLocaleDateString('en', { day: '2-digit' }) : '—',
      month: valid ? parsed.toLocaleDateString('en', { month: 'short' }) : dateText.slice(0, 3),
      eyebrow: textValue(record.countryCode) ?? api.provider,
      title: textValue(record.name ?? record.localName ?? record.title) ?? `Event ${index + 1}`,
      description: record.localName && record.localName !== record.name ? textValue(record.localName) : record.global === true ? 'Observed nationally' : 'Public calendar event',
    }
  })
  return <DateList items={items}/>
}

function SolarCyclePreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const sunrise = textValue(root.sunrise)
  const sunset = textValue(root.sunset)
  if (!sunrise || !sunset) return <div className="weather-empty"><strong>Solar data unavailable</strong><span>The response did not include sunrise and sunset times.</span></div>
  const dayLength = numberValue(root.day_length)
  const duration = dayLength === undefined ? '—' : `${Math.floor(dayLength / 3600)}h ${Math.round((dayLength % 3600) / 60)}m`
  const moments = [
    { label: 'First light', value: root.first_light, icon: '◔' }, { label: 'Sunrise', value: root.sunrise, icon: '↑' },
    { label: 'Solar noon', value: root.solar_noon, icon: '☀' }, { label: 'Sunset', value: root.sunset, icon: '↓' }, { label: 'Last light', value: root.last_light, icon: '◕' },
  ]
  return <div className="solar-preview">
    <div className="solar-hero"><div><span>{textValue(root.tzid) ?? 'Local solar time'} · {textValue(root.date) ?? 'Selected date'}</span><strong>{timeLabel(sunrise)} <i>→</i> {timeLabel(sunset)}</strong><b>{duration} of daylight</b><small>{formatNumber(Number(root.lat), 3)}, {formatNumber(Number(root.lng), 3)} · {textValue(root.moon_phase) ?? 'Moon data available'}</small></div><span aria-hidden="true">☀</span></div>
    <ol className="solar-timeline">{moments.map((moment) => <li key={moment.label}><span aria-hidden="true">{moment.icon}</span><div><small>{moment.label}</small><strong>{timeLabel(moment.value)}</strong></div></li>)}</ol>
  </div>
}

function SpaceWeatherPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const current = isRecord(root['0']) ? root['0'] : {}
  const scales = [
    { key: 'R', label: 'Radio blackout', icon: 'R' },
    { key: 'S', label: 'Solar radiation', icon: 'S' },
    { key: 'G', label: 'Geomagnetic storm', icon: 'G' },
  ].map((scale) => {
    const candidate = current[scale.key]
    const reading: Record<string, unknown> = isRecord(candidate) ? candidate : {}
    return { ...scale, value: numberValue(reading.Scale) ?? 0, text: cleanText(reading.Text) ?? 'None', probability: numberValue(reading.Prob ?? reading.MinorProb) }
  })
  const forecasts = ['1', '2', '3'].map((key) => isRecord(root[key]) ? root[key] : {}).filter((entry) => Object.keys(entry).length)
  if (!Object.keys(current).length) return <div className="weather-empty"><strong>Space-weather scales unavailable</strong><span>NOAA did not return the current R, S, and G scales.</span></div>
  const peak = Math.max(...scales.map((scale) => scale.value))
  return <div className="weather-preview regional-air-preview" data-weather-view="space-weather">
    <div className="air-quality-summary"><div><span>NOAA operational scales</span><strong>{peak === 0 ? 'Quiet' : `Level ${peak}`}</strong><b>{peak === 0 ? 'No current storm-scale activity' : 'Space-weather activity detected'}</b><small>Updated {previewValue(current.DateStamp)} · {previewValue(current.TimeStamp)} UTC</small></div><em className={peak === 0 ? 'good' : 'elevated'}>R · S · G</em></div>
    <div className="regional-reading-grid">{scales.map((scale) => <article key={scale.key}><span>{scale.icon}</span><div><small>{scale.label}</small><strong>{scale.value === 0 ? '0' : scale.value}</strong><b>{scale.text}</b></div><em>{scale.probability === undefined ? 'Current' : `${scale.probability}%`}</em></article>)}</div>
    {forecasts.length ? <div className="forecast-days">{forecasts.map((forecast, index) => {
      const geomagnetic = isRecord(forecast.G) ? forecast.G : {}
      return <article key={`${forecast.DateStamp}-${index}`}><div><span>{dateParts(forecast.DateStamp).weekday}</span><small>{dateParts(forecast.DateStamp).full}</small></div><b aria-hidden="true">◎</b><strong>G{previewValue(geomagnetic.Scale)}</strong><p>{cleanText(geomagnetic.Text) ?? 'No storm expected'}</p><em>NOAA forecast</em></article>
    })}</div> : null}
  </div>
}

function FloodForecastPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const daily = isRecord(root.daily) ? root.daily : {}
  const units = isRecord(root.daily_units) ? root.daily_units : {}
  const times = Array.isArray(daily.time) ? daily.time.map((value) => textValue(value) ?? '') : []
  const discharge = Array.isArray(daily.river_discharge) ? daily.river_discharge.map(numberValue).filter((value): value is number => value !== undefined) : []
  const means = Array.isArray(daily.river_discharge_mean) ? daily.river_discharge_mean.map(numberValue).filter((value): value is number => value !== undefined) : []
  const maxima = Array.isArray(daily.river_discharge_max) ? daily.river_discharge_max.map(numberValue).filter((value): value is number => value !== undefined) : []
  if (!discharge.length) return <div className="weather-empty"><strong>Flood forecast unavailable</strong><span>No daily river-discharge values were returned.</span></div>
  const unit = textValue(units.river_discharge) ?? 'm³/s'
  const peak = Math.max(...maxima, ...discharge)
  const peakIndex = maxima.indexOf(Math.max(...maxima))
  return <div className="market-preview flood-preview">
    <div className="market-summary"><div><span>River discharge · {formatNumber(numberValue(root.latitude) ?? 0, 3)}, {formatNumber(numberValue(root.longitude) ?? 0, 3)}</span><strong>{formatNumber(discharge[0], 2)} {unit}</strong><small>Current modelled discharge · peak {formatNumber(peak, 2)} {unit}</small></div><div className="market-range"><span>{times[0] ?? 'Today'}</span><span>{times.at(-1) ?? 'Forecast end'}</span></div></div>
    <Sparkline values={discharge} label="River discharge forecast sparkline"/>
    <div className="market-metrics"><article><small>Forecast peak</small><strong>{formatNumber(peak, 2)} {unit}</strong></article><article><small>Peak date</small><strong>{times[peakIndex] ?? '—'}</strong></article><article><small>Mean discharge</small><strong>{means.length ? `${formatNumber(means.reduce((sum, value) => sum + value, 0) / means.length, 2)} ${unit}` : '—'}</strong></article></div>
  </div>
}

function FederalRegisterPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const documents = recordArray(root.results).slice(0, 8)
  if (!documents.length) return <div className="weather-empty"><strong>Federal documents unavailable</strong><span>No matching Federal Register documents were returned.</span></div>
  const items: DateListItem[] = documents.map((document, index) => {
    const dateText = textValue(document.publication_date) ?? ''
    const date = new Date(dateText)
    const agencies = recordArray(document.agencies).map((agency) => cleanText(agency.name)).filter(Boolean)
    return {
      key: `${document.document_number}-${index}`,
      dateText,
      day: Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en', { day: '2-digit' }),
      month: Number.isNaN(date.getTime()) ? 'FR' : date.toLocaleDateString('en', { month: 'short' }),
      eyebrow: `${cleanText(document.type) ?? 'Federal document'} · ${agencies[0] ?? 'U.S. Government'}`,
      title: cleanText(document.title) ?? `Document ${index + 1}`,
      description: cleanText(document.abstract) ?? `Document ${previewValue(document.document_number)}`,
    }
  })
  return <DateList items={items} className="federal-register-preview"/>
}

function NaturalEventsPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const events = Array.isArray(root.events) ? root.events.filter(isRecord).slice(0, 6) : []
  if (!events.length) return <div className="weather-empty"><strong>No active events found</strong><span>Try a broader category or a longer date range.</span></div>
  return <div className="natural-events-preview"><div className="event-overview"><div><span>NASA EONET monitor</span><strong>{events.length}</strong><b>active natural events</b></div><div className="event-globe" aria-hidden="true">◎<i/><i/><i/></div></div><div className="event-grid">{events.map((event, index) => {
    const categories = Array.isArray(event.categories) ? event.categories.filter(isRecord) : []
    const geometry = Array.isArray(event.geometry) ? event.geometry.filter(isRecord) : []
    const latest = geometry.at(-1)
    const coordinates = latest && Array.isArray(latest.coordinates) ? latest.coordinates : []
    const magnitude = numberValue(latest?.magnitudeValue)
    return <article key={textValue(event.id) ?? index}><span>{forecastSymbol(textValue(categories[0]?.title))}</span><div><small>{textValue(categories[0]?.title) ?? 'Natural event'} · {timeLabel(latest?.date)}</small><h3>{cleanText(event.title) ?? `Event ${index + 1}`}</h3><p>{coordinates.length >= 2 ? `${formatNumber(Number(coordinates[1]), 3)}, ${formatNumber(Number(coordinates[0]), 3)}` : 'Location tracked by EONET'}{magnitude === undefined ? '' : ` · ${formatNumber(magnitude)} ${textValue(latest?.magnitudeUnit) ?? ''}`}</p></div><em>{event.closed ? 'Closed' : 'Open'}</em></article>
  })}</div></div>
}

function TransitBoardPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  if (isRecord(root.departures)) {
    const departures = recordArray(root.departures.departure).slice(0, 10)
    const station = cleanText(recordValue(root.stationinfo, 'name') ?? root.station) ?? 'Belgian railway station'
    if (!departures.length) return <div className="weather-empty"><strong>No train services found</strong><span>The iRail liveboard did not include departures or arrivals.</span></div>
    return <div className="transit-preview"><div className="transit-summary"><span>Belgian rail liveboard</span><strong>{departures.length}</strong><b>services at {station}</b><small>Live platform and delay information</small></div><div className="transit-routes">{departures.map((departure, index) => {
      const delay = numberValue(departure.delay) ?? 0
      const departureEpoch = numberValue(departure.time)
      const time = departureEpoch === undefined ? undefined : new Date(departureEpoch * 1000).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
      const vehicle = cleanText(departure.vehicle) ?? `Service ${index + 1}`
      return <article key={`${vehicle}-${departure.time}-${index}`} style={{ '--route-color': departure.canceled === '1' ? '#b42318' : delay > 0 ? '#d97706' : '#16805b' } as CSSProperties}><span>{previewValue(departure.platform)}</span><div><small>{delay > 0 ? `Delayed ${Math.round(delay / 60)} min` : 'On schedule'}</small><h3>{cleanText(departure.station) ?? 'Destination unavailable'}</h3><p>{vehicle.replace('BE.NMBS.', '')} · {time ?? previewValue(departure.time)}</p></div><em>{departure.canceled === '1' ? 'Cancelled' : 'Train'}</em></article>
    })}</div></div>
  }
  if (Array.isArray(root.connections)) {
    const connections = recordArray(root.connections).slice(0, 10)
    if (!connections.length) return <div className="weather-empty"><strong>No transit connections found</strong><span>The Swiss open-data response did not return connection records.</span></div>
    return <div className="transit-preview"><div className="transit-summary"><span>Swiss public transport</span><strong>{connections.length}</strong><b>live connections</b><small>Origin, destination and delay details</small></div><div className="transit-routes">{connections.map((connection, index) => {
      const from = isRecord(connection.from) ? connection.from : {}
      const to = isRecord(connection.to) ? connection.to : recordArray(connection.to)[0] ?? {}
      const section = Array.isArray(connection.sections) ? connection.sections.find(isRecord) : undefined
      const leg = Array.isArray(section?.journeys) ? section.journeys[0] : undefined
      const journey = isRecord(leg) ? leg : section
      const delay = numberValue(connection.delay) ?? numberValue(journey?.delay) ?? 0
      const departure = cleanText(from.departure) ?? cleanText(from.departureTime) ?? cleanText(from.time) ?? '—'
      const arrival = cleanText(to.arrival) ?? cleanText(to.arrivalTime) ?? cleanText(to.time) ?? '—'
      const line = cleanText(journey?.name) ?? cleanText(journey?.category) ?? cleanText(from.name) ?? 'Transit connection'
      const platform = cleanText(from.platform) || cleanText(to.platform) || '—'
      const duration = cleanText(connection.duration) || cleanText(journey?.duration) || 'scheduled'
      return <article key={`${departure}-${arrival}-${index}`}><span>{platform}</span><div><small>{delay > 0 ? `Delayed ${delay} min` : 'On schedule'}</small><h3>{cleanText(from.station) ?? cleanText(from.name) ?? 'Unknown origin'} → {cleanText(to.station) ?? cleanText(to.name) ?? 'Unknown destination'}</h3><p>{line} · {duration}</p></div><em>{arrival}</em></article>
    })}</div></div>
  }
  const routes = Array.isArray(root.data) ? root.data.filter(isRecord).slice(0, 10) : []
  if (!routes.length) return <div className="weather-empty"><strong>No transit routes found</strong><span>The response did not include MBTA route records.</span></div>
  return <div className="transit-preview"><div className="transit-summary"><span>Boston network</span><strong>{routes.length}</strong><b>routes in this view</b><small>Live MBTA route catalogue</small></div><div className="transit-routes">{routes.map((route, index) => {
    const attributes = isRecord(route.attributes) ? route.attributes : {}
    const colorValue = textValue(attributes.color) ?? '165C96'
    const color = /^[\da-f]{6}$/i.test(colorValue) ? `#${colorValue}` : '#165c96'
    const destinations = Array.isArray(attributes.direction_destinations) ? attributes.direction_destinations.map(cleanText).filter(Boolean) : []
    return <article key={textValue(route.id) ?? index} style={{ '--route-color': color } as CSSProperties}><span>{textValue(attributes.short_name) || textValue(route.id)?.slice(0, 2) || 'T'}</span><div><small>{cleanText(attributes.description) ?? 'MBTA service'}</small><h3>{cleanText(attributes.long_name) ?? textValue(route.id) ?? `Route ${index + 1}`}</h3><p>{destinations.length ? destinations.join(' ↔ ') : 'Destination information available'}</p></div><em>Route</em></article>
  })}</div></div>
}

function TriviaGamePreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const questions = root.error === false && (root.joke || root.setup) ? [{
    category: root.category,
    difficulty: 'safe mode',
    question: root.setup ?? root.joke,
    correct_answer: root.delivery ?? root.joke,
    incorrect_answers: [],
  }] : Array.isArray(root.results) ? root.results.filter(isRecord).slice(0, 6) : []
  if (!questions.length) return <div className="weather-empty"><strong>No trivia questions found</strong><span>Try a different category or difficulty.</span></div>
  return <div className="trivia-preview"><div className="trivia-score"><span>Quiz deck</span><strong>{questions.length}</strong><b>questions ready</b><small>Correct answers are highlighted for this developer demo.</small></div><div className="trivia-grid" aria-label={questions.length === 1 ? 'Joke answer card' : 'Trivia question cards'}>{questions.map((question, index) => {
    const correct = cleanText(question.correct_answer) ?? 'Answer unavailable'
    const incorrect = Array.isArray(question.incorrect_answers) ? question.incorrect_answers.map(cleanText).filter((answer): answer is string => Boolean(answer)) : []
    const answers = [correct, ...incorrect]
    return <article key={`${correct}-${index}`}><header><span>{index + 1}</span><div><small>{cleanText(question.category) ?? 'Trivia'} · {cleanText(question.difficulty) ?? 'mixed'}</small><h3>{cleanText(question.question) ?? `Question ${index + 1}`}</h3></div></header><ul>{answers.map((answer, answerIndex) => <li className={answerIndex === 0 ? 'correct' : ''} key={`${answer}-${answerIndex}`}><span>{String.fromCharCode(65 + answerIndex)}</span>{answer}{answerIndex === 0 && <b>Answer</b>}</li>)}</ul></article>
  })}</div></div>
}

type DateListItem = {
  key: string
  dateText: string
  day: string
  month: string
  eyebrow: ReactNode
  title: ReactNode
  description: ReactNode
}

function DateList({ items, className }: { items: DateListItem[]; className?: string }) {
  return <ol className={`calendar-preview${className ? ` ${className}` : ''}`}>{items.map((item) => <li key={item.key}><time dateTime={item.dateText}><strong>{item.day}</strong><span>{item.month}</span></time><div><small>{item.eyebrow}</small><h3>{item.title}</h3><p>{item.description}</p></div></li>)}</ol>
}

function DeveloperFeedPreview({ data, api }: { data: unknown; api: ApiDemo }) {
  const root = isRecord(data) ? data : {}
  let cards: SemanticCard[] = []
  if (api.id === 'rubygems-lookup') {
    cards = Object.keys(root).length ? [{ title: cleanText(root.name) ?? 'Ruby gem', eyebrow: `RubyGems · v${previewValue(root.version)}`, description: cleanText(root.info), badge: compactNumber(numberValue(root.downloads) ?? 0), metrics: [{ label: 'Authors', value: previewValue(root.authors) }, { label: 'Licenses', value: textArray(root.licenses).join(', ') || '—' }] }] : []
  } else if (api.id === 'nuget-package-lookup') {
    const lastPage = Array.isArray(root.items) ? root.items[root.items.length - 1] : undefined
    const lastEntry = isRecord(lastPage) && Array.isArray(lastPage.items) ? lastPage.items[lastPage.items.length - 1] : undefined
    const catalogEntry = isRecord(lastEntry) && isRecord(lastEntry.catalogEntry) ? lastEntry.catalogEntry : undefined
    cards = catalogEntry ? [{ title: cleanText(catalogEntry.id) ?? 'NuGet package', eyebrow: `NuGet · v${previewValue(catalogEntry.version)}`, description: cleanText(catalogEntry.description), badge: previewValue(catalogEntry.licenseExpression), metrics: [{ label: 'Published', value: dateParts(catalogEntry.published).full || '—' }, { label: 'Authors', value: previewValue(catalogEntry.authors) }] }] : []
  }
  else if (api.id === 'deps-dev') {
    const packageKey = isRecord(root.packageKey) ? root.packageKey : {}
    const versions = recordArray(root.versions)
    const latest = versions.find((version) => version.isDefault) ?? versions[0]
    const versionKey = latest && isRecord(latest.versionKey) ? latest.versionKey : {}
    cards = Object.keys(packageKey).length ? [{
      title: cleanText(packageKey.name) ?? 'Package',
      eyebrow: `${cleanText(packageKey.system) ?? 'Package'} ecosystem`,
      badge: previewValue(versionKey.version),
      metrics: [
        { label: 'Published versions', value: String(versions.length) },
        { label: 'Latest published', value: dateParts(latest?.publishedAt).full || previewValue(latest?.publishedAt) },
      ],
    }] : []
  }
  else if (api.id === 'posts') cards = [root].filter((record) => Object.keys(record).length > 0).map((record) => ({ title: cleanText(record.title) ?? 'Post', eyebrow: 'JSONPlaceholder post', description: cleanText(record.body), metrics: [{ label: 'Post ID', value: previewValue(record.id) }, { label: 'User ID', value: previewValue(record.userId) }] }))
  else if (api.id === 'devto') cards = recordArray(data).map((record) => ({ title: cleanText(record.title) ?? 'DEV article', eyebrow: cleanText(record.readable_publish_date) ?? 'Published article', description: cleanText(record.description), badge: `${previewValue(record.public_reactions_count)} reactions`, metrics: [{ label: 'Comments', value: previewValue(record.comments_count) }, { label: 'Reading time', value: `${previewValue(record.reading_time_minutes)} min` }], tags: textArray(record.tag_list) }))
  else if (api.id === 'github') cards = recordArray(data).map((record) => ({ title: cleanText(record.full_name ?? record.name) ?? 'Repository', eyebrow: cleanText(record.language) ?? 'GitHub repository', description: cleanText(record.description) ?? 'Public source repository', badge: record.archived ? 'Archived' : 'Active', metrics: [{ label: 'Stars', value: previewValue(record.stargazers_count) }, { label: 'Forks', value: previewValue(record.forks_count) }, { label: 'Issues', value: previewValue(record.open_issues_count) }], tags: textArray(record.topics) }))
  else if (api.id === 'gitlab-public-projects') cards = recordArray(data).map((record) => ({
    title: cleanText(record.path_with_namespace ?? record.name) ?? 'GitLab project',
    eyebrow: `${cleanText(record.language) ?? 'Public repository'} · updated ${dateParts(record.last_activity_at).full || 'recently'}`,
    description: cleanText(record.description) ?? 'Public GitLab project',
    badge: `${compactNumber(numberValue(record.star_count) ?? 0)} stars`,
    metrics: [
      { label: 'Forks', value: compactNumber(numberValue(record.forks_count) ?? 0) },
      { label: 'Issues', value: record.open_issues_count === undefined ? '—' : previewValue(record.open_issues_count) },
      { label: 'Visibility', value: previewValue(record.visibility) },
    ],
    tags: textArray(record.topics ?? record.tag_list),
  }))
  else if (api.id === 'hacker-news') cards = [root].map((record) => ({ title: cleanText(record.title) ?? 'Hacker News item', eyebrow: `${previewValue(record.type)} by ${previewValue(record.by)}`, badge: `${previewValue(record.score)} points`, metrics: [{ label: 'Comments', value: previewValue(record.descendants) }, { label: 'Published', value: epochDate(record.time) ?? '—' }, { label: 'Item ID', value: previewValue(record.id) }] }))
  else if (api.id === 'hn-search-algolia') {
    cards = recordArray(root.hits).map((hit) => ({
      title: cleanText(hit.title ?? hit.story_title) ?? 'Hacker News result',
      eyebrow: 'Hacker News',
      description: cleanText(hit.story_text ?? hit.comment_text) ?? `Open on ${cleanText(hit.url) ?? 'Hacker News'}`,
      badge: cleanText(hit.story_type) ?? 'Story',
      metrics: [
        { label: 'Points', value: previewValue(hit.points) },
        { label: 'Comments', value: previewValue(hit.num_comments) },
        { label: 'Published', value: epochDate(hit.created_at_i) ?? previewValue(hit.created_at) ?? '—' },
      ],
      tags: [...textArray(hit._tags ?? hit.tags), cleanText(hit.author) ?? 'Anonymous'],
    }))
  } else if (api.id === 'packagist-search') {
    cards = recordArray(root.results).map((record) => {
      const downloads = isRecord(record.downloads) ? record.downloads : {}
      return {
        title: cleanText(record.name) ?? 'Packagist package',
        eyebrow: 'Packagist',
        description: cleanText(record.description),
        badge: `${compactNumber(numberValue(downloads.total) ?? 0)} downloads`,
        metrics: [{ label: 'Favourites', value: previewValue(record.favers) }, { label: 'Repository', value: cleanText(record.repository) || '—' }, { label: 'Maintainer', value: cleanText(record.maintainer) || cleanText(record.author) || '—' }],
        tags: [cleanText(record.type) || 'Composer package'],
      }
    })
  }
  else if (api.id === 'jsdelivr-package') {
    const tags = isRecord(root.tags) ? root.tags : {}
    const versions = Array.isArray(root.versions) ? root.versions.filter((value): value is string => typeof value === 'string') : []
    cards = [{
      title: cleanText(tags.latest) ? `${api.name} · ${cleanText(tags.latest)}` : api.name,
      eyebrow: 'npm package metadata via jsDelivr',
      badge: `${versions.length} versions`,
      metrics: [
        { label: 'Latest', value: previewValue(tags.latest) },
        { label: 'Next / canary', value: previewValue(tags.next ?? tags.canary) },
        { label: 'Release candidate', value: previewValue(tags.rc) },
      ],
      tags: versions.slice(0, 4),
    }]
  }
  else if (api.id === 'npm-search') cards = recordArray(root.objects).map((record) => {
    const pkg = isRecord(record.package) ? record.package : {}
    const downloads = isRecord(record.downloads) ? record.downloads : {}
    return { title: cleanText(pkg.name) ?? 'npm package', eyebrow: `v${previewValue(pkg.version)}`, description: cleanText(pkg.description), badge: `${compactNumber(numberValue(downloads.weekly) ?? 0)} weekly`, metrics: [{ label: 'Publisher', value: previewValue(recordValue(pkg.publisher, 'username')) }, { label: 'Updated', value: dateParts(pkg.date).full }, { label: 'Score', value: formatNumber((numberValue(record.searchScore) ?? 0) * 100, 0) }], tags: textArray(pkg.keywords) }
  })
  else if (api.id === 'pypi-json') {
    const info = isRecord(root.info) ? root.info : {}
    cards = [{ title: cleanText(info.name) ?? 'Python package', eyebrow: `Python · v${previewValue(info.version)}`, description: cleanText(info.summary), badge: previewValue(info.license_expression ?? info.license), metrics: [{ label: 'Requires Python', value: previewValue(info.requires_python) }, { label: 'Maintainer', value: previewValue(info.maintainer ?? info.author) }, { label: 'Releases', value: String(Object.keys(isRecord(root.releases) ? root.releases : {}).length) }], tags: textArray(info.keywords?.toString().split(',')) }]
  } else if (api.id === 'pub-dev') {
    const latest = isRecord(root.latest) ? root.latest : {}
    const pubspec = isRecord(latest.pubspec) ? latest.pubspec : {}
    const environment = isRecord(pubspec.environment) ? pubspec.environment : {}
    cards = Object.keys(root).length ? [{
      title: cleanText(root.name) ?? cleanText(pubspec.name) ?? 'Dart package',
      eyebrow: `pub.dev · v${previewValue(latest.version ?? pubspec.version)}`,
      description: cleanText(pubspec.description),
      badge: root.isDiscontinued ? 'Discontinued' : `${recordArray(root.versions).length} versions`,
      metrics: [
        { label: 'Dart SDK', value: previewValue(environment.sdk) },
        { label: 'Published', value: dateParts(latest.published).full || previewValue(latest.published) },
        { label: 'Repository', value: previewValue(pubspec.repository ?? pubspec.homepage) },
      ],
      tags: textArray(pubspec.topics),
    }] : []
  } else if (api.id === 'stack-exchange') cards = recordArray(root.items).map((record) => ({ title: cleanText(record.title) ?? 'Stack Overflow question', eyebrow: epochDate(record.creation_date) ?? 'Active question', badge: record.is_answered ? 'Answered' : 'Open', metrics: [{ label: 'Score', value: previewValue(record.score) }, { label: 'Answers', value: previewValue(record.answer_count) }, { label: 'Views', value: compactNumber(numberValue(record.view_count) ?? 0) }], tags: textArray(record.tags) }))
  return <SemanticCards cards={cards} emptyTitle="Developer records unavailable"/>
}

function SecurityCenterPreview({ data, api }: { data: unknown; api: ApiDemo }) {
  const root = isRecord(data) ? data : {}
  let cards: SemanticCard[] = []
  if (api.id === 'github-global-advisories') cards = recordArray(data).map((advisory) => {
    const vulnerabilities = recordArray(advisory.vulnerabilities)
    const packages = vulnerabilities.map((entry) => cleanText(recordValue(entry.package, 'name'))).filter((value): value is string => Boolean(value))
    const ecosystems = vulnerabilities.map((entry) => cleanText(recordValue(entry.package, 'ecosystem'))).filter((value): value is string => Boolean(value))
    return {
      title: cleanText(advisory.ghsa_id) ?? cleanText(advisory.cve_id) ?? 'GitHub advisory',
      eyebrow: cleanText(advisory.cve_id) ?? 'GitHub Security Advisory',
      description: cleanText(advisory.summary) ?? cleanText(advisory.description),
      badge: previewLabel(cleanText(advisory.severity) ?? 'Reviewed'),
      metrics: [
        { label: 'Affected packages', value: packages.slice(0, 3).join(', ') || '—' },
        { label: 'Published', value: dateParts(advisory.published_at).full || previewValue(advisory.published_at) },
        { label: 'Updated', value: dateParts(advisory.updated_at).full || previewValue(advisory.updated_at) },
      ],
      tags: [...new Set(ecosystems)].slice(0, 5),
    }
  })
  else if (api.id === 'circl-vulnerability') {
    const metadata = isRecord(root.cveMetadata) ? root.cveMetadata : {}
    const containers = isRecord(root.containers) ? root.containers : {}
    const cna = isRecord(containers.cna) ? containers.cna : {}
    const affected = recordArray(cna.affected)
    const products = affected.map((entry) => cleanText(entry.product) ?? cleanText(entry.vendor)).filter((value): value is string => Boolean(value))
    const description = recordArray(cna.descriptions).find((entry) => entry.lang === 'en') ?? recordArray(cna.descriptions)[0]
    cards = Object.keys(root).length ? [{
      title: cleanText(metadata.cveId) ?? 'CVE record',
      eyebrow: `${cleanText(metadata.assignerShortName) ?? 'CIRCL'} · CVE 5 record`,
      description: cleanText(description?.value) ?? cleanText(cna.title),
      badge: cleanText(metadata.state) ?? 'Published',
      metrics: [
        { label: 'Affected products', value: products.slice(0, 4).join(', ') || '—' },
        { label: 'Published', value: dateParts(metadata.datePublished).full || previewValue(metadata.datePublished) },
        { label: 'Updated', value: dateParts(metadata.dateUpdated).full || previewValue(metadata.dateUpdated) },
      ],
      tags: [cleanText(root.dataType), cleanText(root.dataVersion)].filter((value): value is string => Boolean(value)),
    }] : []
  }
  else if (api.id === 'first-epss') cards = recordArray(root.data).map((entry) => {
    const percentile = numberValue(entry.percentile)
    const score = numberValue(entry.epss)
    return {
      title: cleanText(entry.cve) ?? 'CVE',
      eyebrow: 'FIRST.org Exploit Prediction Scoring System',
      badge: score !== undefined ? `${formatNumber(score * 100, 2)}% probability` : undefined,
      metrics: [
        { label: 'EPSS score', value: score !== undefined ? formatNumber(score, 5) : '—' },
        { label: 'Percentile', value: percentile !== undefined ? `${formatNumber(percentile * 100, 1)}%` : '—' },
        { label: 'Model date', value: previewValue(entry.date) },
      ],
    }
  })
  else if (api.id === 'osv-vulnerability') {
    const affected = recordArray(root.affected)
    const packageNames = affected.map((entry) => cleanText(recordValue(entry.package, 'name'))).filter((value): value is string => Boolean(value))
    const ecosystems = affected.map((entry) => cleanText(recordValue(entry.package, 'ecosystem'))).filter((value): value is string => Boolean(value))
    const severity = recordArray(root.severity)[0]
    cards = Object.keys(root).length ? [{
      title: cleanText(root.id) ?? 'OSV advisory',
      eyebrow: 'Open Source Vulnerability database',
      description: cleanText(root.summary ?? root.details),
      badge: cleanText(severity?.type) ?? (root.withdrawn ? 'Withdrawn' : 'Active'),
      metrics: [
        { label: 'Affected packages', value: packageNames.length ? packageNames.slice(0, 3).join(', ') : '—' },
        { label: 'Ecosystems', value: [...new Set(ecosystems)].join(', ') || '—' },
        { label: 'Published', value: dateParts(root.published).full || previewValue(root.published) },
        { label: 'Modified', value: dateParts(root.modified).full || previewValue(root.modified) },
      ],
      tags: [...textArray(root.aliases), ...textArray(root.related)].slice(0, 5),
    }] : []
  } else if (api.id === 'nvd-cpe-search') cards = recordArray(root.products).map((product) => {
    const cpe = isRecord(product.cpe) ? product.cpe : product
    const titles = recordArray(cpe.titles)
    return { title: cleanText(titles[0]?.title) ?? cleanText(cpe.cpeName) ?? 'CPE product', eyebrow: 'NVD product dictionary', badge: cpe.deprecated ? 'Deprecated' : 'Active', metrics: [{ label: 'CPE name', value: previewValue(cpe.cpeName) }, { label: 'Created', value: dateParts(cpe.created).full }, { label: 'Modified', value: dateParts(cpe.lastModified).full }] }
  })
  else cards = recordArray(root.vulnerabilities).map((entry) => {
    const cve = isRecord(entry.cve) ? entry.cve : entry
    const descriptions = recordArray(cve.descriptions)
    const metrics = isRecord(cve.metrics) ? cve.metrics : {}
    const cvss = recordArray(metrics.cvssMetricV31)[0] ?? recordArray(metrics.cvssMetricV30)[0] ?? recordArray(metrics.cvssMetricV2)[0]
    const cvssData = cvss && isRecord(cvss.cvssData) ? cvss.cvssData : {}
    return { title: cleanText(cve.id) ?? 'CVE advisory', eyebrow: 'NIST vulnerability record', description: cleanText(descriptions.find((item) => item.lang === 'en')?.value ?? descriptions[0]?.value), badge: cleanText(cvssData.baseSeverity) ?? cleanText(cve.vulnStatus) ?? 'Reviewed', metrics: [{ label: 'CVSS score', value: previewValue(cvssData.baseScore) }, { label: 'Published', value: dateParts(cve.published).full }, { label: 'Modified', value: dateParts(cve.lastModified).full }] }
  })
  return <SemanticCards cards={cards} emptyTitle="Security records unavailable"/>
}

function ResearchLibraryPreview({ data, api }: { data: unknown; api: ApiDemo }) {
  const root = isRecord(data) ? data : {}
  let cards: SemanticCard[] = []
  if (api.id === 'zenodo-search') cards = recordArray(recordValue(root.hits, 'hits')).map((entry) => {
    const metadata = isRecord(entry.metadata) ? entry.metadata : {}
    const creators = recordArray(metadata.creators).map((creator) => cleanText(creator.name)).filter((value): value is string => Boolean(value))
    return { title: cleanText(metadata.title) ?? 'Zenodo record', eyebrow: creators.join(', ') || 'Zenodo', badge: previewValue(metadata.publication_date), metrics: [{ label: 'Resource type', value: previewValue(recordValue(metadata.resource_type, 'title')) }, { label: 'DOI', value: previewValue(entry.doi) }] }
  })
  else if (api.id === 'doaj-search') cards = recordArray(root.results).map((entry) => {
    const bibjson = isRecord(entry.bibjson) ? entry.bibjson : {}
    const authors = recordArray(bibjson.author).map((author) => cleanText(author.name)).filter((value): value is string => Boolean(value))
    const journal = isRecord(bibjson.journal) ? bibjson.journal : {}
    return { title: cleanText(bibjson.title) ?? 'Open-access article', eyebrow: authors.slice(0, 3).join(', ') || 'DOAJ', badge: previewValue(bibjson.year), metrics: [{ label: 'Journal', value: previewValue(journal.title) }, { label: 'Publisher', value: previewValue(journal.publisher) }] }
  })
  else if (api.id === 'datacite-search') cards = recordArray(root.data).map((entry) => {
    const attributes = isRecord(entry.attributes) ? entry.attributes : {}
    const creators = recordArray(attributes.creators).map((creator) => cleanText(creator.name)).filter((value): value is string => Boolean(value))
    return { title: textArray(attributes.titles).length ? cleanText((recordArray(attributes.titles)[0])?.title) ?? 'Untitled record' : 'Untitled record', eyebrow: creators.join(', ') || cleanText(attributes.publisher) || 'DataCite', badge: previewValue(attributes.publicationYear), metrics: [{ label: 'Resource type', value: previewValue(recordValue(attributes.types, 'resourceTypeGeneral')) }, { label: 'Publisher', value: previewValue(attributes.publisher) }, { label: 'DOI', value: previewValue(attributes.doi) }] }
  })
  else if (api.id === 'ror-search') cards = recordArray(root.items).map((org) => {
    const names = recordArray(org.names)
    const displayName = names.find((entry) => Array.isArray(entry.types) && entry.types.includes('ror_display')) ?? names[0]
    const location = recordArray(org.locations)[0]
    const geoDetails = location && isRecord(location.geonames_details) ? location.geonames_details : {}
    const website = recordArray(org.links).find((link) => link.type === 'website')
    return { title: cleanText(displayName?.value) ?? 'Organization', eyebrow: textArray(org.types).join(', ') || 'Research organization', badge: previewValue(org.established), metrics: [{ label: 'Country', value: previewValue(geoDetails.country_name) }, { label: 'City', value: previewValue(geoDetails.name) }, { label: 'Website', value: previewValue(website?.value) }] }
  })
  else if (api.id === 'open-library-search') cards = recordArray(root.docs).map((book) => ({ title: cleanText(book.title) ?? 'Book', eyebrow: textArray(book.author_name).join(', ') || 'Open Library', badge: previewValue(book.first_publish_year), metrics: [{ label: 'Authors', value: String(textArray(book.author_name).length || 1) }, { label: 'First published', value: previewValue(book.first_publish_year) }, { label: 'Edition key', value: previewValue(book.key) }] }))
  else if (api.id === 'clinical-trials-search') cards = recordArray(root.studies).map((study) => {
    const protocol = isRecord(study.protocolSection) ? study.protocolSection : {}
    const identification = isRecord(protocol.identificationModule) ? protocol.identificationModule : {}
    const status = isRecord(protocol.statusModule) ? protocol.statusModule : {}
    const design = isRecord(protocol.designModule) ? protocol.designModule : {}
    return { title: cleanText(identification.briefTitle ?? identification.officialTitle) ?? 'Clinical study', eyebrow: cleanText(identification.nctId) ?? 'ClinicalTrials.gov', badge: cleanText(status.overallStatus) ?? 'Study', metrics: [{ label: 'Study type', value: previewValue(design.studyType) }, { label: 'Start date', value: previewValue(recordValue(status.startDateStruct, 'date')) }, { label: 'Has results', value: study.hasResults ? 'Yes' : 'No' }] }
  })
  else if (api.id === 'pubmed-search') {
    const result = isRecord(root.esearchresult) ? root.esearchresult : {}
    const ids = Array.isArray(result.idlist) ? result.idlist.filter((item): item is string => typeof item === 'string') : []
    cards = ids.map((id) => ({ title: `PMID ${id}`, eyebrow: 'PubMed article identifier', description: `Open pubmed.ncbi.nlm.nih.gov/${id} for the full record.`, metrics: [{ label: 'Total matches', value: previewValue(result.count) }, { label: 'Query used', value: cleanText(result.querytranslation) ?? '—' }] }))
  }
  else if (api.id === 'europe-pmc-search') {
    const list = isRecord(root.resultList) ? root.resultList : {}
    cards = recordArray(list.result).map((paper) => ({ title: cleanText(paper.title) ?? 'Research paper', eyebrow: cleanText(paper.authorString) ?? 'Europe PMC', description: cleanText(paper.journalTitle), badge: previewValue(paper.pubYear), metrics: [{ label: 'Citations', value: previewValue(paper.citedByCount) }, { label: 'Open access', value: paper.isOpenAccess === 'Y' ? 'Yes' : 'No' }, { label: 'Identifier', value: previewValue(paper.doi ?? paper.pmid ?? paper.id) }] }))
  }
  else if (api.id === 'dblp-search') {
    const bindings = recordArray(recordValue(root.results, 'bindings'))
    const valueOf = (row: Record<string, unknown>, key: string) => cleanText(recordValue(row[key], 'value'))
    const publications = new Map<string, { title?: string; year?: string; venue?: string; doi?: string; authors: string[] }>()
    for (const row of bindings) {
      const publicationUrl = valueOf(row, 'publ')
      if (!publicationUrl) continue
      const current = publications.get(publicationUrl) ?? { authors: [] }
      current.title ??= valueOf(row, 'title')
      current.year ??= valueOf(row, 'year')
      current.venue ??= valueOf(row, 'venue')
      current.doi ??= valueOf(row, 'doi')
      const author = valueOf(row, 'authorName')
      if (author && !current.authors.includes(author)) current.authors.push(author)
      publications.set(publicationUrl, current)
    }
    cards = [...publications.entries()].map(([publicationUrl, publication]) => ({
      title: publication.title ?? 'DBLP publication',
      eyebrow: publication.authors.slice(0, 4).join(', ') || 'DBLP bibliography',
      badge: publication.year ?? '—',
      metrics: [
        { label: 'Venue', value: publication.venue ?? '—' },
        { label: 'DOI', value: publication.doi?.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '') ?? '—' },
        { label: 'DBLP record', value: publicationUrl },
      ],
    }))
  }
  return <SemanticCards cards={cards} emptyTitle="Research records unavailable"/>
}

function DictionaryEntryPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const legacyEntry = recordArray(data)[0]
  const modernEntries = recordArray(root.entries)
  const word = cleanText(legacyEntry?.word) ?? cleanText(root.word) ?? 'Word'
  const legacyPhonetics = legacyEntry ? recordArray(legacyEntry.phonetics) : []
  const modernPronunciations = modernEntries.flatMap((entry) => recordArray(entry.pronunciations))
  const phonetic = cleanText(legacyEntry?.phonetic)
    ?? cleanText(legacyPhonetics.find((item) => item.text)?.text)
    ?? cleanText(modernPronunciations.find((item) => item.type === 'ipa')?.text)
    ?? cleanText(modernPronunciations[0]?.text)
    ?? 'Pronunciation unavailable'
  const meanings = legacyEntry
    ? recordArray(legacyEntry.meanings).map((meaning) => ({
        partOfSpeech: meaning.partOfSpeech,
        definitions: recordArray(meaning.definitions),
        synonyms: textArray(meaning.synonyms),
      }))
    : modernEntries.map((entry) => ({
        partOfSpeech: entry.partOfSpeech,
        definitions: recordArray(entry.senses).map((sense) => ({
          definition: sense.definition,
          example: textArray(sense.examples)[0],
          synonyms: textArray(sense.synonyms),
        })),
        synonyms: [...textArray(entry.synonyms), ...recordArray(entry.senses).flatMap((sense) => textArray(sense.synonyms))],
      }))
  if (!meanings.length) return <div className="weather-empty"><strong>Dictionary entry unavailable</strong><span>No word entry was returned.</span></div>
  return <div className="dictionary-preview"><div className="dictionary-hero"><div><span>English dictionary</span><strong>{word}</strong><b>{phonetic}</b></div><span aria-hidden="true">Aa</span></div><div className="dictionary-meanings">{meanings.slice(0, 8).map((meaning, index) => {
    const definitions = recordArray(meaning.definitions)
    return <section key={`${meaning.partOfSpeech}-${index}`}><header><span>{index + 1}</span><h3>{cleanText(meaning.partOfSpeech) ?? 'Meaning'}</h3></header><ol>{definitions.slice(0, 3).map((definition, definitionIndex) => <li key={definitionIndex}><p>{cleanText(definition.definition) ?? 'Definition unavailable'}</p>{cleanText(definition.example) && <blockquote>“{cleanText(definition.example)}”</blockquote>}</li>)}</ol>{meaning.synonyms.length ? <footer><b>Synonyms</b>{[...new Set(meaning.synonyms)].slice(0, 6).map((synonym) => <span key={synonym}>{synonym}</span>)}</footer> : null}</section>
  })}</div></div>
}

function OpenF1SessionsPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const mrData = isRecord(root.MRData) ? root.MRData : {}
  const raceTable = isRecord(mrData.RaceTable) ? mrData.RaceTable : {}
  const qualifyingRace = recordArray(raceTable.Races)[0]
  if (qualifyingRace) {
    const circuit = isRecord(qualifyingRace.Circuit) ? qualifyingRace.Circuit : {}
    const location = isRecord(circuit.Location) ? circuit.Location : {}
    const cards: SemanticCard[] = recordArray(qualifyingRace.QualifyingResults).slice(0, 10).map((result) => {
      const driver = isRecord(result.Driver) ? result.Driver : {}
      const constructor = isRecord(result.Constructor) ? result.Constructor : {}
      const name = [cleanText(driver.givenName), cleanText(driver.familyName)].filter(Boolean).join(' ') || cleanText(driver.code) || 'Formula 1 driver'
      return {
        title: name,
        eyebrow: `${cleanText(qualifyingRace.raceName) ?? 'Grand Prix'} · P${previewValue(result.position)}`,
        badge: cleanText(driver.code) ?? `#${previewValue(result.number)}`,
        description: `${cleanText(constructor.name) ?? 'Constructor unavailable'} · ${cleanText(driver.nationality) ?? 'Driver'} · ${cleanText(location.locality) ?? 'Circuit'}`,
        metrics: [
          { label: 'Q1', value: previewValue(result.Q1) },
          { label: 'Q2', value: previewValue(result.Q2) },
          { label: 'Q3', value: previewValue(result.Q3) },
          { label: 'Circuit', value: cleanText(circuit.circuitName) ?? '—' },
        ],
      }
    })
    return <SemanticCards cards={cards} emptyTitle="Qualifying results unavailable"/>
  }
  const standingsTable = isRecord(mrData.StandingsTable) ? mrData.StandingsTable : {}
  const standingsList = recordArray(standingsTable.StandingsLists)[0]
  if (standingsList) {
    const cards: SemanticCard[] = recordArray(standingsList.DriverStandings).slice(0, 10).map((standing) => {
      const driver = isRecord(standing.Driver) ? standing.Driver : {}
      const constructor = recordArray(standing.Constructors)[0] ?? {}
      const name = [cleanText(driver.givenName), cleanText(driver.familyName)].filter(Boolean).join(' ') || cleanText(driver.code) || 'Formula 1 driver'
      return {
        title: name,
        eyebrow: `Championship position ${previewValue(standing.position)} · ${cleanText(driver.nationality) ?? 'Driver'}`,
        badge: `${previewValue(standing.points)} pts`,
        description: `${cleanText(constructor.name) ?? 'Constructor unavailable'} · ${previewValue(standing.wins)} win${String(standing.wins) === '1' ? '' : 's'}`,
        metrics: [
          { label: 'Position', value: previewValue(standing.position) },
          { label: 'Points', value: previewValue(standing.points) },
          { label: 'Wins', value: previewValue(standing.wins) },
          { label: 'Constructor', value: previewValue(constructor.name) },
        ],
        tags: [cleanText(driver.code), cleanText(constructor.nationality)].filter((value): value is string => Boolean(value)),
      }
    })
    return <SemanticCards cards={cards} emptyTitle="Formula 1 standings unavailable"/>
  }
  if (Array.isArray(root.events)) {
    const cards: SemanticCard[] = recordArray(root.events).slice(0, 8).map((event) => {
      const competition = recordArray(event.competitions)[0] ?? {}
      const competitors = recordArray(competition.competitors)
      const leader = competitors[0] && isRecord(competitors[0].athlete) ? competitors[0].athlete : {}
      const type = isRecord(competition.type) ? competition.type : {}
      const season = isRecord(event.season) ? event.season : {}
      return {
        title: cleanText(event.name) ?? cleanText(event.shortName) ?? 'Formula 1 event',
        eyebrow: `Formula 1 · ${previewValue(season.year)}`,
        badge: cleanText(type.abbreviation) ?? 'F1',
        description: `${dateParts(event.date).full || previewValue(event.date)} · ${competitors.length} drivers in the current session`,
        metrics: [
          { label: 'Session', value: cleanText(type.abbreviation) ?? cleanText(type.name) ?? 'Race weekend' },
          { label: 'Leader / P1', value: cleanText(leader.displayName ?? leader.fullName) ?? 'Pending' },
          { label: 'Starts', value: previewValue(event.date) },
          { label: 'Ends', value: previewValue(event.endDate) },
        ],
      }
    })
    return <SemanticCards cards={cards} emptyTitle="Formula 1 scoreboard unavailable"/>
  }
  const cards: SemanticCard[] = recordArray(data).map((session) => ({
    title: cleanText(session.meeting_name) ?? cleanText(session.circuit_short_name) ?? 'Formula 1 session',
    eyebrow: `${cleanText(session.country_name) ?? 'Grand Prix'} · ${cleanText(session.location) ?? 'Circuit'}`,
    badge: cleanText(session.session_name) ?? 'Race',
    description: `Completed ${cleanText(session.session_type) ?? 'race'} session.`,
    metrics: [
      { label: 'Session start', value: dateParts(session.date_start).full || previewValue(session.date_start) },
      { label: 'Circuit', value: cleanText(session.circuit_short_name) ?? '—' },
      { label: 'Session key', value: previewValue(session.session_key) },
      { label: 'Meeting key', value: previewValue(session.meeting_key) },
    ],
    tags: [cleanText(session.country_code), cleanText(session.gmt_offset)].filter((value): value is string => Boolean(value)),
  }))
  return <SemanticCards cards={cards} emptyTitle="Formula 1 sessions unavailable"/>
}

function LaunchSchedulePreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const launches = recordArray(root.results).slice(0, 8)
  if (!launches.length) return <div className="weather-empty"><strong>Upcoming launches unavailable</strong><span>No matching mission records were returned.</span></div>
  const items: DateListItem[] = launches.map((launch, index) => {
    const dateText = textValue(launch.net) ?? textValue(launch.window_start) ?? ''
    const parsed = new Date(dateText)
    const provider = cleanText(recordValue(launch.launch_service_provider, 'name')) ?? 'Launch provider'
    const pad = isRecord(launch.pad) ? launch.pad : {}
    const location = cleanText(recordValue(pad.location, 'name') ?? pad.name) ?? 'Launch site pending'
    const mission = isRecord(launch.mission) ? launch.mission : {}
    return {
      key: `${launch.id}-${index}`,
      dateText,
      day: Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('en', { day: '2-digit' }),
      month: Number.isNaN(parsed.getTime()) ? 'TBD' : parsed.toLocaleDateString('en', { month: 'short' }),
      eyebrow: `${provider} · ${cleanText(recordValue(launch.status, 'name')) ?? 'Scheduled'}`,
      title: cleanText(launch.name) ?? cleanText(mission.name) ?? `Launch ${index + 1}`,
      description: `${location} · ${Number.isNaN(parsed.getTime()) ? 'Time pending' : parsed.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}`,
    }
  })
  return <DateList items={items} className="launch-schedule-preview"/>
}

function WiktionaryEntryPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const languageEntries: Array<Record<string, unknown> & { languageCode: string }> = Object.entries(root).flatMap(([languageCode, value]) => recordArray(value).map((entry) => ({ ...entry, languageCode })))
  if (!languageEntries.length) return <div className="weather-empty"><strong>Wiktionary entry unavailable</strong><span>No structured language definitions were returned.</span></div>
  const primary = languageEntries[0]
  return <div className="dictionary-preview wiktionary-preview"><div className="dictionary-hero"><div><span>{cleanText(primary.language) ?? previewLabel(primary.languageCode)} Wiktionary</span><strong>Definition entry</strong><b>{languageEntries.length} part{languageEntries.length === 1 ? '' : 's'} of speech</b></div><span aria-hidden="true">W</span></div><div className="dictionary-meanings">{languageEntries.slice(0, 8).map((entry, index) => {
    const definitions = recordArray(entry.definitions)
    const synonyms = [...textArray(entry.synonyms), ...definitions.flatMap((definition) => textArray(definition.synonyms))]
    return <section key={`${entry.languageCode}-${entry.partOfSpeech}-${index}`}><header><span>{index + 1}</span><h3>{cleanText(entry.partOfSpeech) ?? 'Meaning'}</h3></header><ol>{definitions.slice(0, 4).map((definition, definitionIndex) => {
      const examples = textArray(definition.examples)
      return <li key={definitionIndex}><p>{cleanText(definition.definition) ?? 'Definition unavailable'}</p>{examples[0] && <blockquote>“{examples[0]}”</blockquote>}</li>
    })}</ol>{synonyms.length ? <footer><b>Related words</b>{[...new Set(synonyms)].slice(0, 6).map((word) => <span key={word}>{word}</span>)}</footer> : null}</section>
  })}</div></div>
}

function PoetryReaderPreview({ data }: { data: unknown }) {
  const poems = recordArray(data).slice(0, 4)
  if (!poems.length) return <div className="weather-empty"><strong>Poems unavailable</strong><span>PoetryDB did not return a poem for this author.</span></div>
  const first = poems[0]
  return <div className="dictionary-preview poetry-preview"><div className="dictionary-hero"><div><span>Public-domain reading room</span><strong>{cleanText(first.author) ?? 'Selected poet'}</strong><b>{poems.length} poem{poems.length === 1 ? '' : 's'} in this reading</b></div><span aria-hidden="true">¶</span></div><div className="dictionary-meanings">{poems.map((poem, index) => <section key={`${poem.title}-${index}`}><header><span>{index + 1}</span><h3>{cleanText(poem.title) ?? `Poem ${index + 1}`}</h3></header><ol><li><p>{textArray(poem.lines).slice(0, 6).join(' / ') || 'Poem lines unavailable'}</p><blockquote>{previewValue(poem.linecount)} lines · {cleanText(poem.author) ?? 'Unknown author'}</blockquote></li></ol></section>)}</div></div>
}

function StarWarsPeoplePreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const cards: SemanticCard[] = recordArray(root.results).map((person) => ({
    title: cleanText(person.name) ?? 'Star Wars character',
    eyebrow: `Born ${previewValue(person.birth_year)} · ${cleanText(person.gender) ?? 'Profile'}`,
    badge: textArray(person.species).length ? `${textArray(person.species).length} species link` : 'Human / unknown',
    description: 'Character dossier assembled from SWAPI profile and relationship fields.',
    metrics: [
      { label: 'Height', value: person.height === 'unknown' ? 'Unknown' : `${previewValue(person.height)} cm` },
      { label: 'Mass', value: person.mass === 'unknown' ? 'Unknown' : `${previewValue(person.mass)} kg` },
      { label: 'Films', value: String(Array.isArray(person.films) ? person.films.length : 0) },
      { label: 'Homeworld', value: cleanText(person.homeworld)?.split('/').filter(Boolean).at(-1) ?? 'Unknown' },
    ],
    tags: [cleanText(person.eye_color), cleanText(person.hair_color), cleanText(person.skin_color)].filter((value): value is string => Boolean(value)),
  }))
  return <SemanticCards cards={cards} emptyTitle="Star Wars people unavailable"/>
}

function AnimeQuotePreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const quote = isRecord(root.data) ? root.data : {}
  const anime = isRecord(quote.anime) ? quote.anime : {}
  const character = isRecord(quote.character) ? quote.character : {}
  const content = cleanText(quote.content)
  if (!content) return <div className="weather-empty"><strong>Anime quote unavailable</strong><span>AnimeChan did not return quote content.</span></div>
  return <div className="dictionary-preview anime-quote-preview"><div className="dictionary-hero"><div><span>Anime quote stage</span><strong>{cleanText(anime.name) ?? 'Anime series'}</strong><b>{cleanText(character.name) ?? 'Character unavailable'}</b></div><span aria-hidden="true">“</span></div><div className="dictionary-meanings"><section><header><span>AQ</span><h3>{cleanText(character.name) ?? 'Featured quote'}</h3></header><ol><li><p>“{content}”</p><blockquote>{cleanText(anime.altName) ?? cleanText(anime.name) ?? 'AnimeChan public quote'}</blockquote></li></ol></section></div></div>
}

function BrazilPostcodePreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  if (!Object.keys(root).length) return <div className="weather-empty"><strong>Brazilian postcode unavailable</strong><span>No address profile was returned.</span></div>
  const location = isRecord(root.location) ? root.location : {}
  const coordinates = isRecord(location.coordinates) ? location.coordinates : {}
  const coordinateText = coordinates.latitude !== undefined && coordinates.longitude !== undefined ? `${previewValue(coordinates.latitude)}, ${previewValue(coordinates.longitude)}` : 'Not supplied'
  return <SemanticCards cards={[{
    title: cleanText(root.street) ?? cleanText(root.cep) ?? 'Brazilian postcode',
    eyebrow: `CEP ${previewValue(root.cep)} · ${cleanText(root.city) ?? 'Brazil'}`,
    badge: cleanText(root.state) ?? 'BR',
    description: [cleanText(root.neighborhood), cleanText(root.city), cleanText(root.state)].filter(Boolean).join(' · '),
    metrics: [
      { label: 'City', value: previewValue(root.city) },
      { label: 'Neighbourhood', value: previewValue(root.neighborhood) },
      { label: 'Coordinates', value: coordinateText },
      { label: 'Timezone', value: previewValue(root.timezoneName) },
      { label: 'Source service', value: previewValue(root.service) },
    ],
    tags: ['Address profile', cleanText(location.type)].filter((value): value is string => Boolean(value)),
  }]} emptyTitle="Brazilian postcode unavailable"/>
}

function DndSpellPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  if (!Object.keys(root).length) return <div className="weather-empty"><strong>Spell unavailable</strong><span>No matching D&amp;D 5e spell was returned.</span></div>
  const school = isRecord(root.school) ? cleanText(root.school.name) : undefined
  const classes = recordArray(root.classes).map((entry) => cleanText(entry.name)).filter((value): value is string => Boolean(value))
  return <div className="dictionary-preview dnd-spell-preview"><div className="dictionary-hero"><div><span>{school ?? 'D&amp;D 5e'} spell · Level {previewValue(root.level)}</span><strong>{cleanText(root.name) ?? 'Spell'}</strong><b>{cleanText(root.range) ?? 'Range unavailable'} · {root.concentration ? 'Concentration' : 'No concentration'}</b></div><span aria-hidden="true">✦</span></div><div className="dictionary-meanings"><section><header><span>1</span><h3>Effect</h3></header><ol>{textArray(root.desc).map((paragraph, index) => <li key={index}><p>{paragraph}</p></li>)}</ol>{textArray(root.higher_level).length ? <footer><b>At higher levels</b><span>{textArray(root.higher_level).join(' ')}</span></footer> : null}</section></div><dl className="country-facts"><div><dt>Casting time</dt><dd>{previewValue(root.casting_time)}</dd></div><div><dt>Components</dt><dd>{textArray(root.components).join(', ') || '—'}</dd></div><div><dt>Duration</dt><dd>{previewValue(root.duration)}</dd></div><div><dt>Classes</dt><dd>{classes.join(', ') || '—'}</dd></div></dl></div>
}

type SsotStat = { label: string; value: string; note?: string }

function SsotStatStrip({ eyebrow, title, stats }: { eyebrow: string; title: string; stats: SsotStat[] }) {
  return <div className="ssot-stat-strip"><div className="ssot-stat-heading"><small>{eyebrow}</small><strong>{title}</strong></div><div className="ssot-stat-grid">{stats.map((stat) => <article key={stat.label}><small>{stat.label}</small><strong>{stat.value}</strong>{stat.note && <span>{stat.note}</span>}</article>)}</div></div>
}

function CarparkAvailabilityPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const snapshot = recordArray(root.items)[0] ?? {}
  const carparks = recordArray(snapshot.carpark_data)
  const normalized = carparks.map((carpark) => {
    const lotTypes = recordArray(carpark.carpark_info)
    const total = lotTypes.reduce((sum, info) => sum + (numberValue(info.total_lots) ?? 0), 0)
    const available = lotTypes.reduce((sum, info) => sum + (numberValue(info.lots_available) ?? 0), 0)
    const labels = lotTypes.map((info) => cleanText(info.lot_type)).filter((value): value is string => Boolean(value))
    return { carpark, total, available, lotTypes: labels, occupancy: total > 0 ? ((total - available) / total) * 100 : 0 }
  })
  const totalLots = normalized.reduce((sum, item) => sum + item.total, 0)
  const totalAvailable = normalized.reduce((sum, item) => sum + item.available, 0)
  const occupancy = totalLots > 0 ? ((totalLots - totalAvailable) / totalLots) * 100 : 0
  const cards: SemanticCard[] = normalized.slice(0, 8).map(({ carpark, total, available, lotTypes, occupancy: itemOccupancy }) => ({
    title: cleanText(carpark.carpark_number) ?? 'Carpark',
    eyebrow: `Updated ${cleanText(carpark.update_datetime) ?? 'recently'}`,
    badge: `${formatNumber(itemOccupancy, 0)}% occupied`,
    metrics: [
      { label: 'Available lots', value: compactNumber(available) },
      { label: 'Total lots', value: compactNumber(total) },
      { label: 'Lot types', value: lotTypes.join(', ') || '—' },
    ],
  }))
  if (!cards.length) return <div className="weather-empty"><strong>Carpark availability unavailable</strong><span>No carpark records were returned.</span></div>
  return <div className="ssot-stack"><SsotStatStrip eyebrow="Singapore public carpark network" title={dateParts(snapshot.timestamp).full || previewValue(snapshot.timestamp)} stats={[
    { label: 'Carparks', value: compactNumber(carparks.length), note: 'live records' },
    { label: 'Available lots', value: compactNumber(totalAvailable), note: 'across returned carparks' },
    { label: 'Network occupancy', value: `${formatNumber(occupancy, 1)}%`, note: 'computed from lot totals' },
  ]}/><SemanticCards cards={cards} emptyTitle="Carpark records unavailable"/></div>
}

function MetMuseumSearchPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const ids = Array.isArray(root.objectIDs) ? root.objectIDs.filter((value): value is number => typeof value === 'number') : []
  const total = numberValue(root.total) ?? ids.length
  return <div className="ssot-stack"><SsotStatStrip eyebrow="The Met collection index" title="Singapore search results" stats={[
    { label: 'Matching objects', value: compactNumber(total), note: 'collection records' },
    { label: 'IDs returned', value: compactNumber(ids.length), note: 'ready for object lookup' },
  ]}/><div className="ssot-id-grid" aria-label="Met Museum object IDs">{ids.slice(0, 18).map((id) => <code key={id}>{id}</code>)}</div></div>
}

function NhtsaMakesPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const results = recordArray(root.Results)
  const cards: SemanticCard[] = results.slice(0, 8).map((make) => ({
    title: cleanText(make.Make_Name) ?? 'Vehicle make',
    eyebrow: 'NHTSA vPIC manufacturer registry',
    badge: `ID ${previewValue(make.Make_ID)}`,
    metrics: [{ label: 'Make ID', value: previewValue(make.Make_ID) }],
  }))
  return <div className="ssot-stack"><SsotStatStrip eyebrow="U.S. vehicle product information catalog" title="Manufacturer directory" stats={[
    { label: 'Registry count', value: compactNumber(numberValue(root.Count) ?? results.length), note: 'manufacturers' },
    { label: 'Previewed', value: String(Math.min(results.length, 8)), note: 'first records' },
  ]}/><SemanticCards cards={cards} emptyTitle="Vehicle makes unavailable"/></div>
}

function GbifTaxonomyPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const results = recordArray(root.results)
  const cards: SemanticCard[] = results.slice(0, 8).map((taxon) => ({
    title: cleanText(taxon.scientificName ?? taxon.canonicalName) ?? 'Taxon',
    eyebrow: [cleanText(taxon.kingdom), cleanText(taxon.phylum), cleanText(taxon.class)].filter(Boolean).join(' › ') || 'GBIF taxonomy',
    badge: cleanText(taxon.rank) ?? 'Taxon',
    description: cleanText(taxon.authorship),
    metrics: [
      { label: 'Status', value: previewValue(taxon.taxonomicStatus) },
      { label: 'Family', value: previewValue(taxon.family) },
      { label: 'Genus', value: previewValue(taxon.genus) },
    ],
    tags: [cleanText(taxon.order), cleanText(taxon.nameType), taxon.synonym ? 'Synonym' : 'Accepted name'].filter((value): value is string => Boolean(value)),
  }))
  return <div className="ssot-stack"><SsotStatStrip eyebrow="Global Biodiversity Information Facility" title="Taxonomy matches" stats={[
    { label: 'Matching taxa', value: compactNumber(numberValue(root.count) ?? results.length), note: 'search result count' },
    { label: 'Previewed', value: String(Math.min(results.length, 8)), note: 'taxonomic records' },
  ]}/><SemanticCards cards={cards} emptyTitle="Taxonomy records unavailable"/></div>
}

function GoModuleVersionsPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const versions = Array.isArray(root.versions) ? root.versions.filter((value): value is string => typeof value === 'string') : []
  if (!versions.length) return <div className="weather-empty"><strong>Go module versions unavailable</strong><span>The proxy response did not contain parsed version tags.</span></div>
  const stable = versions.filter((version) => !/-/.test(version))
  return <div className="ssot-stack"><SsotStatStrip eyebrow="Official Go module proxy" title="Published module versions" stats={[
    { label: 'Versions', value: compactNumber(versions.length), note: 'published tags' },
    { label: 'Stable tags', value: compactNumber(stable.length), note: 'without prerelease suffix' },
    { label: 'Latest listed', value: versions.at(-1) ?? versions[0], note: 'proxy order' },
  ]}/><div className="ssot-version-grid">{versions.slice(-24).reverse().map((version) => <code key={version}>{version}</code>)}</div></div>
}

function JsDelivrPackagePreview({ api, data, requestUrl }: { api: ApiDemo; data: unknown; requestUrl?: string }) {
  const root = isRecord(data) ? data : {}
  const tags = isRecord(root.tags) ? root.tags : {}
  const versions = Array.isArray(root.versions) ? root.versions.filter((value): value is string => typeof value === 'string') : []
  let packageName = api.name
  try { packageName = requestUrl ? decodeURIComponent(new URL(requestUrl).pathname.split('/').filter(Boolean).at(-1) ?? api.name) : api.name } catch { /* Keep API name. */ }
  const channels = [
    ['Latest stable', tags.latest],
    ['Release candidate', tags.rc],
    ['Next', tags.next],
    ['Canary', tags.canary],
    ['Backport', tags.backport],
    ['Experimental', tags.experimental],
  ].filter((entry) => entry[1] !== undefined)
  return <div className="package-release-preview" data-ssot-reference="jsdelivr-package"><header><div><small>npm package · jsDelivr data API</small><h3>{packageName}</h3><p>Release channels and published versions from the live package registry metadata.</p></div><div className="package-release-hero"><span>Latest stable</span><strong>{previewValue(tags.latest)}</strong><small>{compactNumber(versions.length)} published versions</small></div></header><div className="package-channel-grid">{channels.map(([label, value]) => <article key={String(label)}><small>{String(label)}</small><strong>{previewValue(value)}</strong></article>)}</div><div className="package-version-list"><div><strong>Recent published versions</strong><span>{Math.min(versions.length, 12)} shown</span></div><div>{versions.slice(0, 12).map((version) => <code key={version}>{version}</code>)}</div></div></div>
}

function GeneratedImagePreview({ api, requestUrl }: { api: ApiDemo; requestUrl?: string }) {
  if (!requestUrl) return <div className="weather-empty"><strong>Image unavailable</strong><span>No request URL was captured for this response.</span></div>
  return <div className="media-preview single"><article><img src={requestUrl} alt={api.name} loading="lazy"/><div><small>{api.category}</small><h3>{api.name}</h3><p>Rendered directly from the live request URL.</p></div></article></div>
}

function DataTablePreview({ data, api }: { data: unknown; api: ApiDemo }) {
  const root = isRecord(data) ? data : {}
  let records: Array<Record<string, unknown>> = []
  if (api.id === 'carbon-intensity-gb') records = recordArray(root.data).map((record) => ({ title: 'GB carbon intensity', status: recordValue(record.intensity, 'index'), value: recordValue(record.intensity, 'actual') ?? recordValue(record.intensity, 'forecast'), unit: 'gCO₂/kWh', updated: record.from }))
  else if (api.id === 'ipify-public-ip') records = [{ title: 'Detected public address', value: root.ip, status: String(root.ip ?? '').includes(':') ? 'IPv6' : 'IPv4', source: 'Network response' }]
  else if (api.id === 'usaspending') records = recordArray(root.results)
  else if (api.id === 'wikidata-sparql') records = recordArray(recordValue(recordValue(root.results, 'bindings'), 'items') ?? recordValue(root.results, 'bindings')).map((binding) => Object.fromEntries(Object.entries(binding).map(([key, value]) => [key, recordValue(value, 'value') ?? value])))
  else if (api.id === 'open-meteo-elevation') {
    const elevationValues = Array.isArray(root.elevation) ? root.elevation : root.elevation === undefined ? [] : [root.elevation]
    const latitudes = Array.isArray(root.latitude) ? root.latitude : [root.latitude]
    const longitudes = Array.isArray(root.longitude) ? root.longitude : [root.longitude]
    records = elevationValues.map((value, index) => ({
      title: `Point ${index + 1}`,
      latitude: textValue(latitudes[index]) ?? textValue(latitudes[0]) ?? '—',
      longitude: textValue(longitudes[index]) ?? textValue(longitudes[0]) ?? '—',
      elevation: numberValue(value) !== undefined ? `${formatNumber(numberValue(value)!, 2)} m` : textValue(value) ?? '—',
    }))
  }
  else if (api.id === 'hdx-humanitarian-datasets') records = recordArray(root.results).slice(0, 8).map((event) => {
    const disasterType = isRecord(event.dtype) ? event.dtype : {}
    const country = recordArray(event.countries)[0] ?? {}
    const report = recordArray(event.field_reports)[0] ?? {}
    return {
      title: cleanText(event.summary) ?? `${cleanText(disasterType.name) ?? 'Emergency'} — ${cleanText(country.name) ?? 'Country unavailable'}`,
      disaster_type: previewValue(disasterType.name),
      country: previewValue(country.name),
      severity: previewValue(event.ifrc_severity_level_display),
      affected: previewValue(report.num_affected ?? event.num_affected),
      deaths: previewValue(report.num_dead),
      displaced: previewValue(report.num_displaced),
      started: dateParts(event.disaster_start_date).full || previewValue(event.disaster_start_date),
      description: cleanText(event.description),
    }
  })
  else if (api.id === 'fiscal-data-treasury') records = Object.keys(root).length ? [{
    title: cleanText(root.name) ?? 'Department of the Treasury',
    fiscal_year: previewValue(root.fiscal_year),
    agency_code: previewValue(root.toptier_code),
    abbreviation: previewValue(root.abbreviation),
    subtier_agencies: previewValue(root.subtier_agency_count),
    description: cleanText(root.mission),
    website: previewValue(root.website),
  }] : []
  else if (api.id === 'models-dev') records = recordArray(data).slice(0, 10).map((model) => ({
    title: cleanText(model.id ?? model.modelId) ?? 'Hugging Face model',
    task: previewValue(model.pipeline_tag),
    library: previewValue(model.library_name),
    downloads: compactNumber(numberValue(model.downloads) ?? 0),
    likes: compactNumber(numberValue(model.likes) ?? 0),
    updated: dateParts(model.lastModified).full || previewValue(model.lastModified),
  }))
  else if (api.id === 'unhcr-refugees') records = recordArray(root.items).slice(0, 10).map((entry) => ({
    title: cleanText(entry.coo_name) ?? cleanText(entry.coo) ?? 'Origin country',
    year: previewValue(entry.year),
    refugees: previewValue(entry.refugees),
    asylum_seekers: previewValue(entry.asylum_seekers),
    internally_displaced: previewValue(entry.idps),
    stateless: previewValue(entry.stateless),
  }))
  else if (api.id === 'opencitations-index') records = recordArray(data).map((entry) => ({
    title: 'Incoming citation count',
    citations: previewValue(entry.count),
    source: 'OpenCitations Index v2',
  }))
  else if (api.id === 'canada-open-data-search') {
    const result = isRecord(root.result) ? root.result : {}
    records = recordArray(result.results).slice(0, 10).map((entry) => ({
      title: cleanText(entry.title) ?? cleanText(recordValue(entry.title_translated, 'en')) ?? cleanText(entry.name) ?? 'Canada open-data record',
      type: previewValue(entry.type ?? entry.collection),
      organization: previewValue(recordValue(entry.organization, 'title')),
      published: previewValue(entry.date_published),
      description: cleanText(entry.notes) ?? cleanText(recordValue(entry.notes_translated, 'en')),
    }))
  }
  else if (api.id === 'geoboundaries-admin-boundaries') records = Object.keys(root).length ? [{
    title: cleanText(root.boundaryName) ?? 'Administrative boundary',
    iso: previewValue(root.boundaryISO),
    admin_level: previewValue(root.boundaryType),
    represented_year: previewValue(root.boundaryYearRepresented),
    license: previewValue(root.boundaryLicense),
    area_sq_km: previewValue(root.meanAreaSqKM),
    source: previewValue(root.boundarySource),
  }] : []
  else if (api.id === 'rxnorm-drug-search') {
    const groups = recordArray(recordValue(root.drugGroup, 'conceptGroup'))
    records = groups.flatMap((group) => recordArray(group.conceptProperties).map((property) => ({ title: cleanText(property.name) ?? 'Drug product', tty: previewValue(group.tty), rxcui: previewValue(property.rxcui), synonym: previewValue(property.synonym) })))
  } else if (api.id === 'un-sdg-goals') {
    records = recordArray(data).slice(0, 10).map((goal) => ({ title: `Goal ${previewValue(goal.code)}`, description: previewValue(goal.title) }))
  } else if (api.id === 'celestrak-satellites') {
    records = recordArray(data).slice(0, 10).map((satellite) => ({
      title: cleanText(satellite.OBJECT_NAME) ?? 'Satellite',
      norad_id: previewValue(satellite.NORAD_CAT_ID),
      inclination: `${previewValue(satellite.INCLINATION)}°`,
      mean_motion: previewValue(satellite.MEAN_MOTION),
      epoch: previewValue(satellite.EPOCH),
    }))
  } else if (api.id === 'eurostat-population') {
    const dimension = isRecord(root.dimension) ? root.dimension : {}
    const geoLabels = isRecord(recordValue(recordValue(dimension.geo, 'category'), 'label')) ? recordValue(recordValue(dimension.geo, 'category'), 'label') as Record<string, unknown> : {}
    const timeIndex = isRecord(recordValue(recordValue(dimension.time, 'category'), 'index')) ? recordValue(recordValue(dimension.time, 'category'), 'index') as Record<string, unknown> : {}
    const value = isRecord(root.value) ? Object.values(root.value)[0] : undefined
    records = value !== undefined ? [{ title: `Population — ${previewValue(Object.values(geoLabels)[0])}`, year: previewValue(Object.keys(timeIndex)[0]), population: previewValue(value), source: previewValue(root.source) }] : []
  } else if (api.id === 'fema-disasters') {
    records = recordArray(root.DisasterDeclarationsSummaries).slice(0, 10).map((entry) => ({ title: cleanText(entry.declarationTitle) ?? 'Disaster declaration', state: previewValue(entry.state), incident_type: previewValue(entry.incidentType), declared: previewValue(entry.declarationDate) }))
  } else if (api.id === 'obis-marine-occurrences') {
    records = recordArray(root.results).slice(0, 10).map((occurrence) => ({ title: cleanText(occurrence.scientificName) ?? 'Marine occurrence', date: previewValue(occurrence.date_year ?? occurrence.eventDate), locality: previewValue(occurrence.locality), depth: previewValue(occurrence.depth) }))
  } else if (api.id === 'worms-species-lookup') {
    records = recordArray(data).slice(0, 5).map((record) => ({ title: cleanText(record.scientificname) ?? 'Species', authority: previewValue(record.authority), rank: previewValue(record.rank), status: previewValue(record.status) }))
  } else if (api.id === 'paleobiodb-taxa') {
    records = recordArray(root.records).slice(0, 5).map((taxon) => ({ title: cleanText(taxon.taxon_name) ?? 'Taxon', rank: previewValue(taxon.taxon_rank), status: previewValue(taxon.is_extant), occurrences: previewValue(taxon.n_occs) }))
  } else if (api.id === 'usgs-water-legacy') {
    const series = recordArray(recordValue(root.value, 'timeSeries'))[0]
    const sourceInfo = series && isRecord(series.sourceInfo) ? series.sourceInfo : {}
    const variable = series && isRecord(series.variable) ? series.variable : {}
    const reading = series ? recordArray(recordValue(recordArray(series.values)[0], 'value'))[0] : undefined
    records = series ? [{ title: cleanText(sourceInfo.siteName) ?? 'USGS gauge', measurement: cleanText(variable.variableName), value: reading ? `${previewValue(reading.value)} ${previewValue(recordValue(variable.unit, 'unitCode'))}` : '—', observed: previewValue(reading?.dateTime) }] : []
  } else if (api.id === 'ipwhois-lookup') {
    const connection = isRecord(root.connection) ? root.connection : {}
    records = root.success ? [{ title: `${previewValue(root.city)}, ${previewValue(root.country)}`, ip: previewValue(root.ip), isp: previewValue(connection.isp), timezone: previewValue(recordValue(root.timezone, 'id')) }] : []
  } else if (api.id === 'newton-math-solver') {
    records = Object.keys(root).length ? [{ title: previewValue(root.expression), operation: previewValue(root.operation), result: previewValue(root.result) }] : []
  } else if (api.id === 'datamuse-rhymes') {
    records = recordArray(data).slice(0, 10).map((entry) => ({ title: cleanText(entry.word) ?? 'Word', score: previewValue(entry.score), syllables: previewValue(entry.numSyllables) }))
  } else if (api.id === 'open5e-monster-search') {
    records = recordArray(root.results).slice(0, 8).map((monster) => ({ title: cleanText(monster.name) ?? 'Monster', type: `${previewValue(monster.size)} ${previewValue(monster.type)}`, armor_class: previewValue(monster.armor_class), hit_points: previewValue(monster.hit_points) }))
  } else if (api.id === 'catfacts') {
    records = cleanText(root.fact) ? [{ title: cleanText(root.fact), length: previewValue(root.length) }] : []
  }
  else records = findPreviewRecords(data)
  const cards = records.map((record, index) => {
    const entries = Object.entries(record).filter(([, value]) => value !== undefined).slice(0, 6)
    const titleEntry = entries.find(([key]) => ['title', 'name', 'recipient name', 'award id'].includes(key.toLowerCase()))
    return { title: cleanText(titleEntry?.[1]) ?? `${api.name} record ${index + 1}`, eyebrow: api.provider, badge: cleanText(record.status ?? record.severity ?? record.event) ?? undefined, description: cleanText(record.description ?? record.summary ?? record.warnings), metrics: entries.filter(([key]) => key !== titleEntry?.[0] && !['description', 'summary', 'warnings'].includes(key.toLowerCase())).slice(0, 4).map(([key, value]) => ({ label: previewLabel(key), value: previewValue(value) })) }
  })
  return <SemanticCards cards={cards} emptyTitle="Structured records unavailable"/>
}

function ResultListPreview({ data, api }: { data: unknown; api: ApiDemo }) {
  const items = buildDemoPreview(data)
  return <div className="demo-preview-grid" data-generic-fallback="true">{items.map((item, index) => <article className="demo-preview-card" aria-label={`${item.title} preview`} key={`${item.title}-${index}`}><div className="demo-preview-card-title"><span style={{ '--api-color': api.accent } as CSSProperties}>{api.monogram}</span><div><small>{api.name}</small><h3>{item.title}</h3></div></div><dl>{item.fields.map((field, fieldIndex) => <div key={`${field.label}-${fieldIndex}`}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></article>)}</div>
}

type ApiPreviewProps = { api: ApiDemo; data: unknown; requestUrl?: string }
export type ApiPreviewComponent = (props: ApiPreviewProps) => ReactElement

const componentName = (id: string) => `${id.split('-').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join('')}Preview`

const defineApiPreview = (id: string, render: (props: ApiPreviewProps) => ReactElement): ApiPreviewComponent => {
  const Component = ({ api, data, requestUrl }: ApiPreviewProps) => <div
    className={`api-specific-preview api-specific-${id}`}
    data-api-preview-component={id}
    data-visual-signature={componentName(id)}
    data-card-design="api-owned-v2"
    aria-label={`${api.name} visual component`}
  >{render({ api, data, requestUrl })}</div>
  Object.defineProperty(Component, 'name', { value: componentName(id) })
  return Component
}

// Every catalog item owns a distinct React component function. Components may
// compose the low-level chart, metric, gallery, map, and timeline primitives
// above, but no catalog item is dispatched through a family-level component.
export const apiPreviewComponents: Partial<Record<string, ApiPreviewComponent>> = {
  countries: defineApiPreview('countries', ({ api, data }) => <CountryPreview api={api} data={data}/>),
  weather: defineApiPreview('weather', ({ api, data }) => <CurrentConditionsPreview api={api} data={data}/>),
  people: defineApiPreview('people', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  dogs: defineApiPreview('dogs', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  posts: defineApiPreview('posts', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  holidays: defineApiPreview('holidays', ({ api, data }) => <CalendarPreview api={api} data={data}/>),
  'geocoding-search': defineApiPreview('geocoding-search', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'aladhan-prayer-times': defineApiPreview('aladhan-prayer-times', ({ data }) => <PrayerTimesPreview data={data}/>),
  'open-meteo-air-quality': defineApiPreview('open-meteo-air-quality', ({ api, data }) => <AirQualityForecastPreview data={data}/>),
  'sunrise-sunset': defineApiPreview('sunrise-sunset', ({ data }) => <SolarCyclePreview data={data}/>),
  'nasa-eonet-events': defineApiPreview('nasa-eonet-events', ({ data }) => <NaturalEventsPreview data={data}/>),
  'mbta-transit-routes': defineApiPreview('mbta-transit-routes', ({ data }) => <TransitBoardPreview data={data}/>),
  'open-trivia': defineApiPreview('open-trivia', ({ data }) => <TriviaGamePreview data={data}/>),
  'carbon-intensity-gb': defineApiPreview('carbon-intensity-gb', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'data-gov-24hr-forecast': defineApiPreview('data-gov-24hr-forecast', ({ data }) => <TwentyFourHourForecastPreview data={data}/>),
  'data-gov-4day-forecast': defineApiPreview('data-gov-4day-forecast', ({ data }) => <FourDayForecastPreview data={data}/>),
  'data-gov-air-temperature': defineApiPreview('data-gov-air-temperature', ({ api, data }) => <StationReadingsPreview api={api} data={data}/>),
  'data-gov-carpark': defineApiPreview('data-gov-carpark', ({ data }) => <CarparkAvailabilityPreview data={data}/>),
  'data-gov-forecast-2hr': defineApiPreview('data-gov-forecast-2hr', ({ data }) => <AreaForecastPreview data={data}/>),
  'data-gov-pm25': defineApiPreview('data-gov-pm25', ({ api, data }) => <RegionalAirQualityPreview api={api} data={data}/>),
  'data-gov-psi': defineApiPreview('data-gov-psi', ({ api, data }) => <RegionalAirQualityPreview api={api} data={data}/>),
  'data-gov-rainfall': defineApiPreview('data-gov-rainfall', ({ api, data }) => <StationReadingsPreview api={api} data={data}/>),
  'data-gov-relative-humidity': defineApiPreview('data-gov-relative-humidity', ({ api, data }) => <StationReadingsPreview api={api} data={data}/>),
  'data-gov-taxi': defineApiPreview('data-gov-taxi', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'data-gov-traffic-images': defineApiPreview('data-gov-traffic-images', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'data-gov-uv-index': defineApiPreview('data-gov-uv-index', ({ data }) => <UvIndexPreview data={data}/>),
  'data-gov-wind-direction': defineApiPreview('data-gov-wind-direction', ({ api, data }) => <StationReadingsPreview api={api} data={data}/>),
  'data-gov-wind-speed': defineApiPreview('data-gov-wind-speed', ({ api, data }) => <StationReadingsPreview api={api} data={data}/>),
  'data-usa': defineApiPreview('data-usa', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  devto: defineApiPreview('devto', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'fiscal-data-treasury': defineApiPreview('fiscal-data-treasury', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  github: defineApiPreview('github', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'hacker-news': defineApiPreview('hacker-news', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'ipify-public-ip': defineApiPreview('ipify-public-ip', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'met-museum-object-detail': defineApiPreview('met-museum-object-detail', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'met-museum-search': defineApiPreview('met-museum-search', ({ data }) => <MetMuseumSearchPreview data={data}/>),
  'nhtsa-vpic': defineApiPreview('nhtsa-vpic', ({ data }) => <NhtsaMakesPreview data={data}/>),
  'nhtsa-vehicle-recalls': defineApiPreview('nhtsa-vehicle-recalls', ({ data, requestUrl }) => <RecallsPreview data={data} requestUrl={requestUrl}/>),
  'npm-search': defineApiPreview('npm-search', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'nvd-cpe-search': defineApiPreview('nvd-cpe-search', ({ api, data }) => <SecurityCenterPreview api={api} data={data}/>),
  'nvd-cve-detail': defineApiPreview('nvd-cve-detail', ({ api, data }) => <SecurityCenterPreview api={api} data={data}/>),
  'nvd-cves': defineApiPreview('nvd-cves', ({ api, data }) => <SecurityCenterPreview api={api} data={data}/>),
  'nvd-recent-cves': defineApiPreview('nvd-recent-cves', ({ api, data }) => <SecurityCenterPreview api={api} data={data}/>),
  'postcodes-io': defineApiPreview('postcodes-io', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'pypi-json': defineApiPreview('pypi-json', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'stack-exchange': defineApiPreview('stack-exchange', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'uk-bank-holidays': defineApiPreview('uk-bank-holidays', ({ api, data }) => <CalendarPreview api={api} data={data}/>),
  'hebcal-calendar': defineApiPreview('hebcal-calendar', ({ api, data }) => <CalendarPreview api={api} data={data}/>),
  usaspending: defineApiPreview('usaspending', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  usgs: defineApiPreview('usgs', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'wikidata-sparql': defineApiPreview('wikidata-sparql', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'openssf-scorecard': defineApiPreview('openssf-scorecard', ({ data }) => <ScorecardPreview data={data}/>),
  'opencitations-index': defineApiPreview('opencitations-index', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'world-bank-gdp': defineApiPreview('world-bank-gdp', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'world-bank-population': defineApiPreview('world-bank-population', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'frankfurter-sgd-myr-history': defineApiPreview('frankfurter-sgd-myr-history', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'open-library-search': defineApiPreview('open-library-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'free-dictionary': defineApiPreview('free-dictionary', ({ data }) => <DictionaryEntryPreview data={data}/>),
  pokeapi: defineApiPreview('pokeapi', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'art-institute-search': defineApiPreview('art-institute-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'tvmaze-search': defineApiPreview('tvmaze-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'open-food-facts': defineApiPreview('open-food-facts', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'gbif-species-search': defineApiPreview('gbif-species-search', ({ data }) => <GbifTaxonomyPreview data={data}/>),
  'clinical-trials-search': defineApiPreview('clinical-trials-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'europe-pmc-search': defineApiPreview('europe-pmc-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'openfda-drug-labels': defineApiPreview('openfda-drug-labels', ({ data }) => <DrugLabelPreview data={data}/>),
  'coinpaprika-ticker': defineApiPreview('coinpaprika-ticker', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'malaysia-fuel-price': defineApiPreview('malaysia-fuel-price', ({ data }) => <FuelPricePreview data={data}/>),
  'open-meteo-marine': defineApiPreview('open-meteo-marine', ({ data }) => <MarineForecastPreview data={data}/>),
  'nobel-prizes': defineApiPreview('nobel-prizes', ({ data }) => <NobelPrizePreview data={data}/>),
  'chess-player-stats': defineApiPreview('chess-player-stats', ({ data }) => <ChessRatingsPreview data={data}/>),
  'crossref-works': defineApiPreview('crossref-works', ({ data }) => <CrossrefWorksPreview data={data}/>),
  'noaa-space-weather': defineApiPreview('noaa-space-weather', ({ data }) => <SpaceWeatherPreview data={data}/>),
  'osv-vulnerability': defineApiPreview('osv-vulnerability', ({ api, data }) => <SecurityCenterPreview api={api} data={data}/>),
  'federal-register-documents': defineApiPreview('federal-register-documents', ({ data }) => <FederalRegisterPreview data={data}/>),
  'wikipedia-search': defineApiPreview('wikipedia-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'open-meteo-elevation': defineApiPreview('open-meteo-elevation', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'open-meteo-flood': defineApiPreview('open-meteo-flood', ({ data }) => <FloodForecastPreview data={data}/>),
  'open-meteo-history': defineApiPreview('open-meteo-history', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'kraken-public-ticker': defineApiPreview('kraken-public-ticker', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'gitlab-public-projects': defineApiPreview('gitlab-public-projects', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'uk-police-street-crime': defineApiPreview('uk-police-street-crime', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'open-brewery-directory': defineApiPreview('open-brewery-directory', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'rick-morty-characters': defineApiPreview('rick-morty-characters', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'wikimedia-pageviews': defineApiPreview('wikimedia-pageviews', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'vam-collections': defineApiPreview('vam-collections', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'openf1-historical': defineApiPreview('openf1-historical', ({ data }) => <OpenF1SessionsPreview data={data}/>),
  'irail-liveboard': defineApiPreview('irail-liveboard', ({ data }) => <TransitBoardPreview data={data}/>),
  'spaceflight-news': defineApiPreview('spaceflight-news', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'launch-library-upcoming': defineApiPreview('launch-library-upcoming', ({ data }) => <LaunchSchedulePreview data={data}/>),
  'wiktionary-entry': defineApiPreview('wiktionary-entry', ({ data }) => <WiktionaryEntryPreview data={data}/>),
  'animechan-random-quote': defineApiPreview('animechan-random-quote', ({ data }) => <AnimeQuotePreview data={data}/>),
  'jokeapi-safe': defineApiPreview('jokeapi-safe', ({ data }) => <TriviaGamePreview data={data}/>),
  'dummyjson-recipes': defineApiPreview('dummyjson-recipes', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'brasilapi-postcode': defineApiPreview('brasilapi-postcode', ({ data }) => <BrazilPostcodePreview data={data}/>),
  'poetrydb-poems': defineApiPreview('poetrydb-poems', ({ data }) => <PoetryReaderPreview data={data}/>),
  'coingecko-keyless-market': defineApiPreview('coingecko-keyless-market', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'swapi-people': defineApiPreview('swapi-people', ({ data }) => <StarWarsPeoplePreview data={data}/>),
  'google-dns-doh': defineApiPreview('google-dns-doh', ({ data }) => <DnsPreview data={data}/>),
  'color-api': defineApiPreview('color-api', ({ data }) => <ColorPreview data={data}/>),
  'nasa-image-search': defineApiPreview('nasa-image-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'lichess-top-players': defineApiPreview('lichess-top-players', ({ data }) => <LichessLeaderboardPreview data={data}/>),
  'pubmed-search': defineApiPreview('pubmed-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'rxnorm-drug-search': defineApiPreview('rxnorm-drug-search', ({ data, requestUrl }) => <RxNormDrugPreview data={data} requestUrl={requestUrl}/>),
  'inaturalist-observations': defineApiPreview('inaturalist-observations', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'first-epss': defineApiPreview('first-epss', ({ api, data }) => <SecurityCenterPreview api={api} data={data}/>),
  'endoflife-date': defineApiPreview('endoflife-date', ({ data }) => <LifecyclePreview data={data}/>),
  'deps-dev': defineApiPreview('deps-dev', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'ecb-fx-rates': defineApiPreview('ecb-fx-rates', ({ data }) => <CoinbaseRatesPreview data={data}/>),
  'un-sdg-goals': defineApiPreview('un-sdg-goals', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'datacite-search': defineApiPreview('datacite-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'ror-search': defineApiPreview('ror-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'celestrak-satellites': defineApiPreview('celestrak-satellites', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'cleveland-museum-search': defineApiPreview('cleveland-museum-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'scryfall-card-search': defineApiPreview('scryfall-card-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'dnd5e-spell-lookup': defineApiPreview('dnd5e-spell-lookup', ({ data }) => <DndSpellPreview data={data}/>),
  'qr-code-generator': defineApiPreview('qr-code-generator', ({ api, requestUrl }) => <GeneratedImagePreview api={api} requestUrl={requestUrl}/>),
  'where-the-iss-at': defineApiPreview('where-the-iss-at', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'eurostat-population': defineApiPreview('eurostat-population', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'bls-timeseries': defineApiPreview('bls-timeseries', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'fema-disasters': defineApiPreview('fema-disasters', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'noaa-tides': defineApiPreview('noaa-tides', ({ data, requestUrl }) => <TideWaterLevelPreview data={data} requestUrl={requestUrl}/>),
  'rdap-domain-lookup': defineApiPreview('rdap-domain-lookup', ({ data }) => <RdapDomainPreview data={data}/>),
  'languagetool-grammar-check': defineApiPreview('languagetool-grammar-check', ({ data }) => <GrammarPreview data={data}/>),
  'zenodo-search': defineApiPreview('zenodo-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'doaj-search': defineApiPreview('doaj-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'pubchem-compound': defineApiPreview('pubchem-compound', ({ data }) => <PubChemCompoundPreview data={data}/>),
  'chembl-molecule': defineApiPreview('chembl-molecule', ({ data }) => <ChemblMoleculePreview data={data}/>),
  'uniprot-protein': defineApiPreview('uniprot-protein', ({ data }) => <ProteinAnnotationPreview data={data}/>),
  'rcsb-pdb-entry': defineApiPreview('rcsb-pdb-entry', ({ data }) => <PdbStructurePreview data={data}/>),
  'ensembl-gene-lookup': defineApiPreview('ensembl-gene-lookup', ({ data }) => <EnsemblGenePreview data={data}/>),
  'obis-marine-occurrences': defineApiPreview('obis-marine-occurrences', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'worms-species-lookup': defineApiPreview('worms-species-lookup', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'paleobiodb-taxa': defineApiPreview('paleobiodb-taxa', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'usgs-water-legacy': defineApiPreview('usgs-water-legacy', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'rubygems-lookup': defineApiPreview('rubygems-lookup', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'nuget-package-lookup': defineApiPreview('nuget-package-lookup', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'internet-archive-search': defineApiPreview('internet-archive-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'ipwhois-lookup': defineApiPreview('ipwhois-lookup', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'newton-math-solver': defineApiPreview('newton-math-solver', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'datamuse-rhymes': defineApiPreview('datamuse-rhymes', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'open5e-monster-search': defineApiPreview('open5e-monster-search', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'dicebear-avatar': defineApiPreview('dicebear-avatar', ({ api, requestUrl }) => <GeneratedImagePreview api={api} requestUrl={requestUrl}/>),
  'catfacts': defineApiPreview('catfacts', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'randomfox-photo': defineApiPreview('randomfox-photo', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'anilist-graphql': defineApiPreview('anilist-graphql', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'openverse-search': defineApiPreview('openverse-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'apple-itunes-search': defineApiPreview('apple-itunes-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'packagist-search': defineApiPreview('packagist-search', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'jolpica-f1': defineApiPreview('jolpica-f1', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'hn-search-algolia': defineApiPreview('hn-search-algolia', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'bank-of-canada-valet': defineApiPreview('bank-of-canada-valet', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'swiss-transit-connections': defineApiPreview('swiss-transit-connections', ({ api, data }) => <TransitBoardPreview data={data}/>),
  'nasa-power-climate': defineApiPreview('nasa-power-climate', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'zippopotam-postcode': defineApiPreview('zippopotam-postcode', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'malaysia-core-cpi': defineApiPreview('malaysia-core-cpi', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'malaysia-household-income': defineApiPreview('malaysia-household-income', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'malaysia-population': defineApiPreview('malaysia-population', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'openfda-food-recalls': defineApiPreview('openfda-food-recalls', ({ data }) => <FoodRecallPreview data={data}/>),
  'iconify-search': defineApiPreview('iconify-search', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'homebrew-formula-json': defineApiPreview('homebrew-formula-json', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'npm-download-counts': defineApiPreview('npm-download-counts', ({ data }) => <DownloadsPreview data={data}/>),
  'geoboundaries-admin-boundaries': defineApiPreview('geoboundaries-admin-boundaries', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'osrm-route': defineApiPreview('osrm-route', ({ data }) => <OsrmRoutePreview data={data}/>),
  'opendota-pro-matches': defineApiPreview('opendota-pro-matches', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'openligadb-matches': defineApiPreview('openligadb-matches', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'uk-parliament-members': defineApiPreview('uk-parliament-members', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'mlb-stats-api': defineApiPreview('mlb-stats-api', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'gleif-lei': defineApiPreview('gleif-lei', ({ data }) => <GleifLeiPreview data={data}/>),
  'fdic-bankfind': defineApiPreview('fdic-bankfind', ({ data }) => <FdicBankPreview data={data}/>),
  'uk-food-hygiene': defineApiPreview('uk-food-hygiene', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'uk-flood-monitoring': defineApiPreview('uk-flood-monitoring', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'unhcr-refugees': defineApiPreview('unhcr-refugees', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'hdx-humanitarian-datasets': defineApiPreview('hdx-humanitarian-datasets', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'open-meteo-climate': defineApiPreview('open-meteo-climate', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'models-dev': defineApiPreview('models-dev', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'vatcomply': defineApiPreview('vatcomply', ({ data }) => <VatcomplyRatesPreview data={data}/>),
  'mempool-space-btc': defineApiPreview('mempool-space-btc', ({ data }) => <MempoolFeePreview data={data}/>),
  'metacpan': defineApiPreview('metacpan', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'hexpm': defineApiPreview('hexpm', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'pub-dev': defineApiPreview('pub-dev', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'go-module-proxy': defineApiPreview('go-module-proxy', ({ data }) => <GoModuleVersionsPreview data={data}/>),
  'flathub-appstream': defineApiPreview('flathub-appstream', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'github-global-advisories': defineApiPreview('github-global-advisories', ({ api, data }) => <SecurityCenterPreview api={api} data={data}/>),
  'dblp-search': defineApiPreview('dblp-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'citybikes-network': defineApiPreview('citybikes-network', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'wikimedia-commons-search': defineApiPreview('wikimedia-commons-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'nominatim-search': defineApiPreview('nominatim-search', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'jsdelivr-package': defineApiPreview('jsdelivr-package', ({ api, data, requestUrl }) => <JsDelivrPackagePreview api={api} data={data} requestUrl={requestUrl}/>),
  'canada-open-data-search': defineApiPreview('canada-open-data-search', ({ api, data }) => <DataTablePreview api={api} data={data}/>),
  'gbif-occurrence-search': defineApiPreview('gbif-occurrence-search', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'open-meteo-ensemble': defineApiPreview('open-meteo-ensemble', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'world-bank-indicator-explorer': defineApiPreview('world-bank-indicator-explorer', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'exchange-rate-current': defineApiPreview('exchange-rate-current', ({ data }) => <ExchangeRateApiPreview data={data}/>),
  'circl-vulnerability': defineApiPreview('circl-vulnerability', ({ api, data }) => <SecurityCenterPreview api={api} data={data}/>),
}

export const apiPreviewComponentIds = Object.keys(apiPreviewComponents)


export type ApiSsotCardDefinition = {
  id: string
  layout: PreviewLayout
  label: string
  Component: ApiPreviewComponent
  source: 'live-response'
  fallbackPolicy: 'forbidden'
}

export const apiSsotCardRegistry: Partial<Record<string, ApiSsotCardDefinition>> = Object.fromEntries(apiCatalog.map((api) => {
  const profile = getPreviewProfile(api.id)
  const Component = apiPreviewComponents[api.id]
  if (!profile || !Component) throw new Error(`Missing SSOT card definition for ${api.id}`)
  return [api.id, {
    id: api.id,
    layout: profile.layout,
    label: profile.label,
    Component,
    source: 'live-response' as const,
    fallbackPolicy: 'forbidden' as const,
  }]
}))

export const apiSsotCardIds = Object.keys(apiSsotCardRegistry)

const previewMeta: Record<PreviewLayout, { icon: string; eyebrow: string; title: string; description: string }> = {
  'security-scorecard': { icon: '◇', eyebrow: 'Security practices', title: 'Repository check evidence', description: 'Individual scored and inconclusive security checks.' },
  'grammar-review': { icon: 'Aa', eyebrow: 'Writing review', title: 'Grammar findings', description: 'Context, explanations and suggested replacements.' },
  'vehicle-recalls': { icon: '!', eyebrow: 'Vehicle recalls', title: 'Recall campaigns', description: 'Complete defect, consequence and remedy information.' },
  'color-swatch': { icon: '◐', eyebrow: 'Color specification', title: 'Color workbench', description: 'A color swatch with full color-space specifications.' },
  'dns-records': { icon: '⌘', eyebrow: 'DNS diagnosis', title: 'DNS records', description: 'Resolver status, cache lifetime, and complete answer records.' },
  'download-summary': { icon: '↓', eyebrow: 'Package adoption', title: 'Download summary', description: 'Period downloads with the provider reporting window.' },
  'release-lifecycle': { icon: '◷', eyebrow: 'Software lifecycle', title: 'Release support', description: 'Release cycles, maintenance flags and dated support milestones.' },
  'exchange-rates': { icon: '⇄', eyebrow: 'Currency conversion', title: 'Exchange rates', description: 'Convert using this response and inspect available rates.' },

  'weather-dashboard': { icon: '☀', eyebrow: 'Live response · Weather layout', title: 'Current conditions', description: 'A ready-to-use weather dashboard built from observations, units, and location data.' },
  'country-profile': { icon: '◎', eyebrow: 'Live response · Profile layout', title: 'Country profile', description: 'A structured destination profile using regional and economic metadata.' },
  'market-chart': { icon: '↗', eyebrow: 'Live response · Market layout', title: 'Market snapshot', description: 'A financial panel that turns price history and rates into an at-a-glance trend.' },
  'media-gallery': { icon: '▧', eyebrow: 'Live response · Visual layout', title: 'Visual gallery', description: 'An image-led interface using media, profile, or catalogue fields from the response.' },
  'location-map': { icon: '⌖', eyebrow: 'Live response · Location layout', title: 'Location explorer', description: 'A spatial interface that maps coordinates and keeps every location agent-readable.' },
  'calendar-timeline': { icon: '□', eyebrow: 'Live response · Calendar layout', title: 'Event timeline', description: 'A chronological interface built from dates, event names, and regional metadata.' },
  'solar-cycle': { icon: '☀', eyebrow: 'Live response · Solar layout', title: 'Sun & moon cycle', description: 'A daylight timeline built from local sunrise, sunset, twilight, solar, and lunar data.' },
  'natural-events': { icon: '◎', eyebrow: 'Live response · Earth monitor', title: 'Natural events monitor', description: 'Near-real-time natural events organized by category, location, status, and observation time.' },
  'transit-board': { icon: 'T', eyebrow: 'Live response · Transit layout', title: 'Transit route board', description: 'A route-focused interface using MBTA colors, destinations, and service types.' },
  'trivia-game': { icon: '?', eyebrow: 'Live response · Game layout', title: 'Trivia challenge', description: 'A playable-looking question deck with decoded prompts, answer options, and difficulty labels.' },
  'developer-feed': { icon: '</>', eyebrow: 'Live response · Developer layout', title: 'Developer workspace', description: 'Repositories, packages, posts, and community activity translated into actionable cards.' },
  'security-center': { icon: '◇', eyebrow: 'Live response · Security layout', title: 'Security advisory center', description: 'Vulnerability and product records organized by severity, identifiers, and review dates.' },
  'research-library': { icon: '▤', eyebrow: 'Live response · Research layout', title: 'Research library', description: 'Books, papers, and clinical studies presented with authorship, status, and identifiers.' },
  'dictionary-entry': { icon: 'Aa', eyebrow: 'Live response · Language layout', title: 'Dictionary entry', description: 'Definitions, parts of speech, examples, and synonyms mapped from the word response.' },
  'drug-label': { icon: 'Rx', eyebrow: 'Live response · Drug label layout', title: 'Drug label summary', description: 'Product identity and regulated label sections mapped from the returned openFDA record.' },
  'food-recalls': { icon: 'FDA', eyebrow: 'Live response · Recall layout', title: 'Food recall enforcement report', description: 'Recall identity, classification, status, affected product, firm, dates, reason, and distribution mapped from FDA enforcement records.' },
  'prayer-schedule': { icon: '◷', eyebrow: 'Live response · Prayer schedule', title: 'Daily prayer times', description: 'Prayer times, Gregorian/Hijri date context, timezone, coordinates, and calculation method mapped from the AlAdhan response.' },
  'drug-terminology': { icon: 'Rx', eyebrow: 'Live response · Drug terminology', title: 'RxNorm drug concepts', description: 'Clinical and branded drug concepts grouped by RxNorm term type with stable RxCUI identifiers.' },
  'coastal-water-level': { icon: '≈', eyebrow: 'Live response · Coastal observation', title: 'Coastal water level', description: 'Station identity, observed height, datum, timing, and NOAA quality-control evidence from the latest CO-OPS water-level response.' },
  'protein-annotation': { icon: 'P', eyebrow: 'Live response · Protein annotation', title: 'Protein annotation', description: 'Stable UniProtKB identity, organism, gene, sequence facts, and bounded provider function annotation.' },
  'molecular-structure': { icon: '3D', eyebrow: 'Live response · Molecular structure', title: 'Molecular structure record', description: 'PDB entry identity, experimental method, resolution, archive facts, entity counts, and primary publication metadata.' },
  'molecule-profile': { icon: '◇', eyebrow: 'Live response · Molecule profile', title: 'ChEMBL molecule profile', description: 'Molecule identity, provider chemical properties, development metadata, structure identifiers, and classifications.' },
  'compound-properties': { icon: '◇', eyebrow: 'Live response · Compound properties', title: 'PubChem compound properties', description: 'Stable PubChem compound identity with the requested molecular formula, molecular weight, and IUPAC name.' },
  'gene-locus': { icon: 'DNA', eyebrow: 'Live response · Gene locus', title: 'Ensembl gene locus', description: 'Stable gene identity, species, assembly coordinates, strand, biotype, canonical transcript, and provider description.' },
  'domain-registration': { icon: '◎', eyebrow: 'Live response · Registration layout', title: 'Domain registration', description: 'Registrar identity, lifecycle dates, nameservers, registry handle, and complete RDAP status.' },
  'legal-entity': { icon: 'LEI', eyebrow: 'Live response · Entity layout', title: 'Legal entity profile', description: 'Official LEI identity, headquarters, registration state, mapped identifiers, and available corporate relationship links.' },
  'bank-institution': { icon: '$', eyebrow: 'Live response · Banking layout', title: 'FDIC institution profile', description: 'Institution identity, operating status, headquarters, reported assets/deposits, offices, and regulator metadata.' },
  'route-summary': { icon: '↝', eyebrow: 'Live response · Route layout', title: 'Route summary', description: 'Provider route distance, estimated travel time, snapped endpoints, geometry size, and turn-by-turn steps.' },
  'transaction-fees': { icon: '₿', eyebrow: 'Live response · Fee layout', title: 'Bitcoin fee recommendations', description: 'Provider-recommended sat/vB rates for fastest, half-hour, hour, economy, and minimum transaction targets.' },
  'availability-board': { icon: 'P', eyebrow: 'Live response · Availability layout', title: 'Availability board', description: 'Capacity, availability, occupancy, and record coverage mapped into an operational status board.' },
  'collection-index': { icon: '▦', eyebrow: 'Live response · Collection index', title: 'Collection index', description: 'Collection match counts and provider object identifiers exposed as a semantic search index.' },
  'manufacturer-directory': { icon: 'M', eyebrow: 'Live response · Directory layout', title: 'Manufacturer directory', description: 'Manufacturer identities and registry identifiers presented as a semantic directory.' },
  'taxonomy-directory': { icon: 'T', eyebrow: 'Live response · Taxonomy layout', title: 'Taxonomy directory', description: 'Scientific names, ranks, status, lineage, and taxonomy identifiers presented as domain records.' },
  'motorsport-results': { icon: 'F1', eyebrow: 'Live response · Motorsport layout', title: 'Motorsport results', description: 'Race-session, qualifying, standings, driver, constructor, and timing facts mapped into competition results.' },
  'quote-card': { icon: '“', eyebrow: 'Live response · Quote layout', title: 'Quote card', description: 'Quoted text, speaker identity, and source work presented as a readable semantic quotation.' },
  'character-dossier': { icon: '✦', eyebrow: 'Live response · Character layout', title: 'Character dossier', description: 'Character identity, physical attributes, appearances, and relationship facts presented as semantic profiles.' },
  'data-table': { icon: '▦', eyebrow: 'Live response · Data layout', title: 'Structured data view', description: 'Purpose-built records that expose the most useful values from this response.' },
  'fuel-dashboard': { icon: '⛽', eyebrow: 'Live response · Fuel market layout', title: 'Malaysia fuel board', description: 'Official weekly pump prices, subsidy tiers, changes, and price history in a retail-market dashboard.' },
  'marine-forecast': { icon: '≈', eyebrow: 'Live response · Marine layout', title: 'Marine forecast', description: 'Wave, current, bearing, period, and sea-temperature series presented as a coastal conditions cockpit.' },
  'awards-timeline': { icon: 'N', eyebrow: 'Live response · Awards layout', title: 'Nobel Prize timeline', description: 'Prize years, categories, laureates, discoveries, and award values arranged chronologically.' },
  'chess-ratings': { icon: '♞', eyebrow: 'Live response · Chess layout', title: 'Player ratings', description: 'Competitive ratings, personal bests, match records, and win ratios compared across time controls.' },
  'scholarly-search': { icon: 'DOI', eyebrow: 'Live response · Scholarly layout', title: 'Scholarly works', description: 'DOI metadata organized by title, authorship, publication year, publisher, type, and citation count.' },
  'result-list': { icon: '✦', eyebrow: 'Live response · Results layout', title: 'Result explorer', description: 'A structured result browser adapted to this API response.' },
}

const weatherPreviewMeta: Record<WeatherPreviewVariant, { icon: string; eyebrow: string; title: string; description: string }> = {
  current: previewMeta['weather-dashboard'],
  'four-day': { icon: '☂', eyebrow: 'Live response · Daily forecast', title: '4-day outlook', description: 'Daily conditions, temperature ranges, humidity, and wind values mapped directly from the forecast response.' },
  'twenty-four-hour': { icon: '◒', eyebrow: 'Live response · Regional forecast', title: '24-hour forecast', description: 'A full-day outlook with general conditions and time-based forecasts for every Singapore region.' },
  'area-forecast': { icon: '⌖', eyebrow: 'Live response · Neighbourhood forecast', title: '2-hour area forecast', description: 'Short-range conditions grouped by named Singapore neighbourhoods.' },
  'station-readings': { icon: '◉', eyebrow: 'Live response · Sensor network', title: 'Station readings', description: 'Live measurements joined with station names, units, coordinates, and network statistics.' },
  'regional-air-quality': { icon: '≋', eyebrow: 'Live response · Air quality', title: 'Regional air quality', description: 'PSI and particulate readings compared across Singapore’s five reporting regions.' },
  'air-quality-forecast': { icon: '≋', eyebrow: 'Live response · Air quality', title: 'Current air quality', description: 'Current AQI and pollutant concentrations mapped directly from the selected coordinates.' },
  'uv-index': { icon: '☀', eyebrow: 'Live response · UV monitoring', title: 'UV index', description: 'The latest ultraviolet exposure level and its reporting timeline.' },
}

export function ResponseDemoPreview({ api, data, requestUrl, runtime }: { api: ApiDemo; data: unknown; requestUrl?: string; runtime?: SsotRuntimeMeta }) {
  const ssotDefinition = apiSsotCardRegistry[api.id]
  const layout = ssotDefinition?.layout ?? selectPreviewLayout(api)
  const weatherVariant = layout === 'weather-dashboard' ? selectWeatherPreviewVariant(api) : undefined
  const profileLabel = ssotDefinition?.label ?? getPreviewProfile(api.id)?.label ?? previewMeta[layout].eyebrow
  const layoutMeta = weatherVariant ? weatherPreviewMeta[weatherVariant] : previewMeta[layout]
  const PreviewComponent = ssotDefinition?.Component ?? apiPreviewComponents[api.id]
  const content: ReactNode = PreviewComponent
    ? <PreviewComponent api={api} data={data} requestUrl={requestUrl}/>
    : <ResultListPreview data={data} api={api}/>

  const headingId = `demo-preview-${api.id}`
  const formattedSize = runtime ? formatResponseBytes(runtime.size) : undefined
  return <section
    className={`demo-preview preview-${layout}`}
    aria-labelledby={headingId}
    data-webmcp-surface="api-demo-preview"
    data-ssot-card={api.id}
    data-ssot-design="result-card-v2"
    data-ssot-source="live-response"
    data-ssot-adapter={PreviewComponent ? componentName(api.id) : 'generic-fallback'}
    data-ssot-fallback={PreviewComponent ? 'false' : 'true'}
    data-preview-layout={layout}
    data-preview-variant={weatherVariant}
    data-preview-component={PreviewComponent ? api.id : 'generic-fallback'}
    data-api-id={api.id}
    data-provider={api.provider}
    data-category={api.category}
    style={{ '--preview-accent': api.accent } as CSSProperties}
  >
    <span className="sr-only" role="status">Live result ready for {api.name}.</span>
    <div className="demo-preview-head">
      <span className="demo-preview-monogram" aria-hidden="true">{api.monogram}</span>
      <div className="demo-preview-copy">
        <div className="demo-preview-kicker"><span className="live-response-badge"><i aria-hidden="true"/>Live response</span><span className="preview-profile-badge"><i aria-hidden="true">{layoutMeta.icon}</i>{profileLabel}</span></div>
        <h2 id={headingId}>{api.name}</h2>
        <p>{api.description}</p>
        <div className="demo-preview-context" aria-label="API context"><span>Provider · {api.provider}</span><span>Category · {api.category}</span></div>
      </div>
      <div className="ssot-runtime" aria-label="Live request metadata">{runtime ? <><b aria-label={`HTTP status ${runtime.httpStatus}`}>{runtime.httpStatus} OK</b><span aria-label={`Response time ${runtime.elapsed} milliseconds`}>{runtime.elapsed} ms</span><span aria-label={`Response size ${formattedSize}`}>{formattedSize}</span></> : <span>Preview ready</span>}</div>
    </div>
    {content}
  </section>
}
