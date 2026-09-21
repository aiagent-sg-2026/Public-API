import './catalogFamilyCards.css'
import type { CSSProperties, ReactNode } from 'react'
import type { ApiDemo } from '../apiCatalog'
import type { ExecutedRequestContext } from '../useApiRequestRuntime'
import { cleanText, findPreviewRecords, forecastSymbol, formatNumber, isRecord, numberValue, previewValue, recordArray, recordValue, textArray, textValue, timeLabel } from './previewData'

import { buildDemoPreview } from './buildDemoPreview'
import { CardEmpty } from './cardPrimitives'
import { finiteNumber, positiveInteger, positiveSafeInteger, trimmedText } from './semanticValidation'

type MediaItem = { image: string; title: string; subtitle?: string }

export { CrossrefWorksPreview } from './CrossrefWorksPreview'
export { FloodForecastPreview } from './OpenMeteoFloodPreview'
export { GbifOccurrencePreview } from './GbifOccurrencePreview'
export { UsgsEarthquakePreview } from './UsgsEarthquakePreview'
export { DataGovTaxiAvailabilityPreview } from './DataGovTaxiAvailabilityPreview'
export { PubMedSearchPreview } from './PubMedSearchPreview'
export { ClinicalTrialsSearchPreview } from './ClinicalTrialsSearchPreview'
export { OpenLibrarySearchPreview } from './OpenLibrarySearchPreview'
export { OpenFoodFactsPreview } from './OpenFoodFactsPreview'
export { UkPoliceStreetCrimePreview } from './UkPoliceStreetCrimePreview'
export { CityBikesNetworkPreview } from './CityBikesNetworkPreview'
export { WikimediaCommonsSearchPreview } from './WikimediaCommonsSearchPreview'
export { WikipediaSearchPreview } from './WikipediaSearchPreview'
export { OpenverseSearchPreview } from './OpenverseSearchPreview'
export { NasaImageSearchPreview } from './NasaImageSearchPreview'
export { OpenMeteoGeocodingPreview } from './OpenMeteoGeocodingPreview'
export { PostcodesIoPreview } from './PostcodesIoPreview'
export { ZippopotamPostcodePreview } from './ZippopotamPostcodePreview'
export { OpenBreweryDirectoryPreview } from './OpenBreweryDirectoryPreview'
export { ClevelandMuseumSearchPreview } from './ClevelandMuseumSearchPreview'
export { VamCollectionsPreview } from './VamCollectionsPreview'
export { ArtInstituteSearchPreview } from './ArtInstituteSearchPreview'
export { INaturalistObservationsPreview } from './INaturalistObservationsPreview'
export { InternetArchiveSearchPreview } from './InternetArchiveSearchPreview'
export { ScryfallCardSearchPreview } from './ScryfallCardSearchPreview'
export { AppleItunesSearchPreview } from './AppleItunesSearchPreview'
export { SpaceflightNewsPreview } from './SpaceflightNewsPreview'
export { PokeApiPreview } from './PokeApiPreview'
export { TvmazeSearchPreview } from './TvmazeSearchPreview'
export { RickMortyCharactersPreview } from './RickMortyCharactersPreview'
export { FlathubAppstreamPreview } from './FlathubAppstreamPreview'
export { RandomUserPeoplePreview } from './RandomUserPeoplePreview'
export { DummyJsonRecipesPreview } from './DummyJsonRecipesPreview'
export { DogGalleryPreview } from './DogGalleryPreview'
export { NagerHolidaysPreview } from './NagerHolidaysPreview'
export { UkBankHolidaysPreview } from './UkBankHolidaysPreview'
export { HebcalCalendarPreview } from './HebcalCalendarPreview'

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
  const records = findPreviewRecords(data)
  const urls = collectImageUrls(data)
  return urls.slice(0, 6).map((image, index) => {
    const record = records[index] ?? records[0] ?? {}
    const nested = isRecord(record.show) ? record.show : isRecord(record.product) ? record.product : record
    return { image, title: textValue(nested.name ?? nested.title ?? nested.product_name) ?? `${api.name} ${index + 1}`, subtitle: cleanText(nested.artist_title ?? nested.email ?? nested.summary ?? nested.brands) }
  })
}

export function MediaGalleryPreview({ data, api }: { data: unknown; api: ApiDemo }) {
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

type AniListMediaType = 'ANIME' | 'MANGA'
type AniListRequestIdentity = { search: string; type: AniListMediaType; page: number; perPage: number }

const aniListRequestIdentity = (executedRequest?: ExecutedRequestContext): AniListRequestIdentity | null | undefined => {
  if (!executedRequest) return undefined
  if (executedRequest.method !== 'POST') return null
  try {
    const url = new URL(executedRequest.url)
    if (url.origin !== 'https://graphql.anilist.co' || url.pathname !== '/' || url.search || url.hash) return null
  } catch { return null }
  if (!isRecord(executedRequest.body)) return null
  const query = trimmedText(executedRequest.body.query)
  const variables = isRecord(executedRequest.body.variables) ? executedRequest.body.variables : undefined
  const queryContract = query
    && /Page\s*\(\s*page\s*:\s*\$page\s*,\s*perPage\s*:\s*\$perPage\s*\)/.test(query)
    && /media\s*\(\s*search\s*:\s*\$search\s*,\s*type\s*:\s*\$type\s*,\s*sort\s*:\s*POPULARITY_DESC\s*\)/.test(query)
  if (!queryContract || !variables) return null
  const search = trimmedText(variables.search)
  const page = positiveInteger(variables.page)
  const perPage = positiveInteger(variables.perPage)
  const type = variables.type === 'ANIME' || variables.type === 'MANGA' ? variables.type : undefined
  if (!search || !page || page > 10 || !perPage || perPage > 20 || !type) return null
  return { search, type, page, perPage }
}

const aniListTitle = (media: Record<string, unknown>) => {
  const title = isRecord(media.title) ? media.title : {}
  return cleanText(title.romaji) ?? cleanText(title.english) ?? cleanText(title.native)
}

const aniListMediaValid = (value: unknown, requestedType?: AniListMediaType) => {
  if (!isRecord(value) || positiveSafeInteger(value.id) === undefined || !aniListTitle(value)) return false
  if (value.type !== 'ANIME' && value.type !== 'MANGA') return false
  return requestedType ? value.type === requestedType : true
}

export function AniListMediaPreview({ api, data, executedRequest }: { api: ApiDemo; data: unknown; executedRequest?: ExecutedRequestContext }) {
  const request = aniListRequestIdentity(executedRequest)
  if (executedRequest && !request) return <CardEmpty domain="anilist-media-search" title="Invalid AniList request identity" detail="The executed request was not the documented AniList GraphQL media-search POST contract." state="invalid"/>
  if (!isRecord(data)) return <CardEmpty domain="anilist-media-search" title="Invalid AniList media response" detail="AniList did not return the documented GraphQL response object." state="invalid"/>

  const graphqlErrors = data.errors === undefined ? [] : Array.isArray(data.errors) ? data.errors : undefined
  if (!graphqlErrors) return <CardEmpty domain="anilist-media-search" title="Invalid AniList media response" detail="The GraphQL errors field was not an array." state="invalid"/>
  const root = isRecord(data.data) ? data.data : undefined
  const page = root && isRecord(root.Page) ? root.Page : undefined
  const pageInfo = page && isRecord(page.pageInfo) ? page.pageInfo : undefined
  if (!page || !pageInfo || !Array.isArray(page.media)) {
    return <CardEmpty domain="anilist-media-search" title="Invalid AniList media response" detail="AniList did not return the requested Page, pageInfo, and media array contract." state="invalid"/>
  }

  const currentPage = positiveInteger(pageInfo.currentPage)
  const perPage = positiveInteger(pageInfo.perPage)
  if (!currentPage || !perPage) return <CardEmpty domain="anilist-media-search" title="Invalid AniList pagination response" detail="AniList did not return numeric currentPage and perPage values requested by this query." state="invalid"/>
  const pageMatch = request ? currentPage === request.page : undefined
  const perPageMatch = request ? perPage === request.perPage : undefined
  if (request && (!pageMatch || !perPageMatch)) {
    return <CardEmpty domain="anilist-media-search" title="AniList request identity mismatch" detail="The HTTP-success response page does not match the executed GraphQL page variables, so its media records are withheld." state="invalid"/>
  }

  const providerCount = page.media.length
  if (providerCount === 0) {
    if (!request || graphqlErrors.length) return <CardEmpty domain="anilist-media-search" title="AniList result could not be verified" detail="AniList returned no media records, but the response could not be bound to a clean executed request." state="invalid"/>
    return <CardEmpty domain="anilist-media-search" title="No AniList media returned" detail={`AniList returned no ${request.type.toLowerCase()} results for “${request.search}” on page ${request.page}.`} state="empty"/>
  }

  const validMedia = page.media.filter((item) => aniListMediaValid(item, request?.type)) as Record<string, unknown>[]
  const invalidCount = providerCount - validMedia.length
  if (!validMedia.length) return <CardEmpty domain="anilist-media-search" title="AniList media identity mismatch" detail="AniList returned media records, but none matched the documented identity fields and executed media type, so plausible results are withheld." state="invalid"/>

  const resultState = !request || graphqlErrors.length > 0 || invalidCount > 0 ? 'partial' : 'ready'
  const sanitized = { data: { Page: { media: validMedia } } }
  return <div
    className="domain-card anilist-media-search-preview"
    data-domain-card="anilist-media-search"
    data-result-state={resultState}
    data-request-bound={request ? 'true' : 'false'}
    data-requested-search={request?.search}
    data-requested-media-type={request?.type}
    data-requested-page={request?.page}
    data-requested-per-page={request?.perPage}
    data-provider-current-page={currentPage}
    data-provider-per-page={perPage}
    data-page-match={pageMatch === undefined ? undefined : String(pageMatch)}
    data-per-page-match={perPageMatch === undefined ? undefined : String(perPageMatch)}
    data-provider-media-count={providerCount}
    data-valid-media-count={validMedia.length}
    data-invalid-media-count={invalidCount}
    data-graphql-error-count={graphqlErrors.length}
  >
    <p className="domain-note">{request ? `Validated ${validMedia.length} ${request.type.toLowerCase()} result${validMedia.length === 1 ? '' : 's'} for “${request.search}” · page ${currentPage}.` : 'AniList media fields are usable, but executed-request identity is unavailable, so this result remains partial.'}</p>
    {graphqlErrors.length > 0 && <p className="domain-note">AniList also returned {graphqlErrors.length} GraphQL error{graphqlErrors.length === 1 ? '' : 's'}; only validated media records are shown.</p>}
    {invalidCount > 0 && <p className="domain-note">{invalidCount} provider record{invalidCount === 1 ? ' was' : 's were'} withheld because required media identity or requested type did not validate.</p>}
    <MediaGalleryPreview api={api} data={sanitized}/>
  </div>
}

type SolarRequestIdentity = { latitude: number; longitude: number; date: string }

const solarCoordinate = (value: string | null, minimum: number, maximum: number) => {
  if (!value || value !== value.trim() || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : undefined
}

const solarDate = (value: string | null) => {
  if (!value || value === 'today' || value === 'tomorrow') return value ?? undefined
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : undefined
}

const parseSolarRequest = (requestUrl: string | undefined, executedRequest: ExecutedRequestContext | undefined): SolarRequestIdentity | undefined => {
  if (!executedRequest || executedRequest.method.toUpperCase() !== 'GET' || executedRequest.body !== undefined || (requestUrl !== undefined && requestUrl !== executedRequest.url)) return undefined
  try {
    const url = new URL(executedRequest.url)
    const authority = /^https:\/\/([^/?#]+)/.exec(executedRequest.url)?.[1]
    const keys = [...url.searchParams.keys()]
    if (url.protocol !== 'https:' || url.hostname !== 'api.sunrise-sunset.org' || authority !== 'api.sunrise-sunset.org' || url.port !== '' || url.pathname !== '/v2' || url.username || url.password || url.hash || keys.length !== 3 || new Set(keys).size !== 3 || !keys.every((key) => ['lat', 'lng', 'date'].includes(key))) return undefined
    const latitude = solarCoordinate(url.searchParams.get('lat'), -90, 90)
    const longitude = solarCoordinate(url.searchParams.get('lng'), -180, 180)
    const date = solarDate(url.searchParams.get('date'))
    return latitude === undefined || longitude === undefined || date === undefined ? undefined : { latitude, longitude, date }
  } catch {
    return undefined
  }
}

const solarResponseDate = (value: unknown) => {
  const candidate = textValue(value)
  if (!candidate || !/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return undefined
  const date = new Date(`${candidate}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === candidate ? candidate : undefined
}

export function SolarCyclePreview({ data, requestUrl, executedRequest }: { data: unknown; requestUrl?: string; executedRequest?: ExecutedRequestContext }) {
  const root = isRecord(data) ? data : {}
  const request = parseSolarRequest(requestUrl, executedRequest)
  const sunrise = textValue(root.sunrise)
  const sunset = textValue(root.sunset)
  const responseDate = solarResponseDate(root.date)
  const providerLatitude = finiteNumber(root.lat)
  const providerLongitude = finiteNumber(root.lng)
  const identityMatch = request !== undefined
    && responseDate !== undefined
    && providerLatitude !== undefined
    && providerLongitude !== undefined
    && providerLatitude === request.latitude
    && providerLongitude === request.longitude
    && (request.date === 'today' || request.date === 'tomorrow' || responseDate === request.date)
  const envelopeValid = Boolean(sunrise && sunset && responseDate !== undefined && providerLatitude !== undefined && providerLongitude !== undefined)
  const state = !request || !envelopeValid || !identityMatch ? 'invalid' : 'ready'
  const evidence = {
    'data-result-state': state,
    'data-request-bound': String(request !== undefined),
    'data-request-contract': 'exact-sunrise-sunset-v2',
    'data-request-latitude': request?.latitude,
    'data-request-longitude': request?.longitude,
    'data-request-date': request?.date,
    'data-provider-latitude': providerLatitude,
    'data-provider-longitude': providerLongitude,
    'data-provider-date': responseDate,
    'data-identity-match': request === undefined ? 'unbound' : String(identityMatch),
  }
  if (state === 'invalid' || !sunrise || !sunset || responseDate === undefined || providerLatitude === undefined || providerLongitude === undefined) return <div className="weather-empty" data-domain-card="solar-cycle" {...evidence}><strong>Solar response unavailable</strong><span>{!request ? 'The successful response was not bound to the exact bodyless GET Sunrise-Sunset request.' : !envelopeValid ? 'The HTTP-success response did not include the documented solar identity and sunrise/sunset fields.' : 'The provider solar identity does not match the exact executed request, so these timings are withheld.'}</span></div>
  const dayLength = finiteNumber(root.day_length)
  const duration = dayLength === undefined ? '—' : `${Math.floor(dayLength / 3600)}h ${Math.round((dayLength % 3600) / 60)}m`
  const moments = [
    { label: 'First light', value: root.first_light, icon: '◔' }, { label: 'Sunrise', value: root.sunrise, icon: '↑' },
    { label: 'Solar noon', value: root.solar_noon, icon: '☀' }, { label: 'Sunset', value: root.sunset, icon: '↓' }, { label: 'Last light', value: root.last_light, icon: '◕' },
  ]
  return <div className="solar-preview" data-domain-card="solar-cycle" {...evidence}>
    <div className="solar-hero"><div><span>{textValue(root.tzid) ?? 'Local solar time'} · {responseDate}</span><strong>{timeLabel(sunrise)} <i>→</i> {timeLabel(sunset)}</strong><b>{duration} of daylight</b><small>{formatNumber(providerLatitude, 3)}, {formatNumber(providerLongitude, 3)} · {textValue(root.moon_phase) ?? 'Moon data available'}</small></div><span aria-hidden="true">☀</span></div>
    <ol className="solar-timeline">{moments.map((moment) => <li key={moment.label}><span aria-hidden="true">{moment.icon}</span><div><small>{moment.label}</small><strong>{timeLabel(moment.value)}</strong></div></li>)}</ol>
  </div>
}

export { FederalRegisterPreview } from './FederalRegisterPreview'

export function NaturalEventsPreview({ data }: { data: unknown }) {
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

export function TransitBoardPreview({ data }: { data: unknown }) {
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

export function TriviaGamePreview({ data }: { data: unknown }) {
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

export function DictionaryEntryPreview({ data }: { data: unknown }) {
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

export function ResultListPreview({ data, api }: { data: unknown; api: ApiDemo }) {
  const items = buildDemoPreview(data)
  return <div className="demo-preview-grid" data-generic-fallback="true">{items.map((item, index) => <article className="demo-preview-card" aria-label={`${item.title} preview`} key={`${item.title}-${index}`}><div className="demo-preview-card-title"><span style={{ '--api-color': api.accent } as CSSProperties}>{api.monogram}</span><div><small>{api.name}</small><h3>{item.title}</h3></div></div><dl>{item.fields.map((field, fieldIndex) => <div key={`${field.label}-${fieldIndex}`}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></article>)}</div>
}
