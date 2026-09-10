import './catalogFamilyCards.css'
import type { CSSProperties, ReactNode } from 'react'
import type { ApiDemo } from '../apiCatalog'
import { Sparkline } from './ChartPrimitives'
import { SemanticCards, type SemanticCard } from './SemanticCards'
import { cleanText, compactNumber, dateParts, epochDate, findPreviewRecords, forecastSymbol, formatNumber, isRecord, numberValue, previewLabel, previewValue, recordArray, recordValue, textArray, textValue, timeLabel } from './previewData'

import { buildDemoPreview } from './buildDemoPreview'
import { DateList, type DateListItem } from './DateList'

type MediaItem = { image: string; title: string; subtitle?: string }
type LocationPoint = { latitude: number; longitude: number; label: string; detail?: string }

export function CrossrefWorksPreview({ data }: { data: unknown }) {
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

export function LocationPreview({ data, api }: { data: unknown; api: ApiDemo }) {
  const points = locationPoints(data, api)
  if (!points.length) return <ResultListPreview data={data} api={api}/>
  const lats = points.map((point) => point.latitude)
  const lons = points.map((point) => point.longitude)
  const latMin = Math.min(...lats); const latRange = Math.max(...lats) - latMin || 1
  const lonMin = Math.min(...lons); const lonRange = Math.max(...lons) - lonMin || 1
  return <div className="location-preview"><div className="location-map" role="img" aria-label={`Map with ${points.length} response locations`}><span className="map-compass">N</span>{points.map((point, index) => <i key={`${point.latitude}-${point.longitude}-${index}`} style={{ '--point-x': `${10 + ((point.longitude - lonMin) / lonRange) * 80}%`, '--point-y': `${90 - ((point.latitude - latMin) / latRange) * 80}%` } as CSSProperties}><b>{index + 1}</b></i>)}</div><ol>{points.slice(0, 5).map((point, index) => <li key={`${point.label}-${index}`}><span>{index + 1}</span><div><strong>{point.label}</strong><small>{point.detail ?? `${formatNumber(point.latitude, 4)}, ${formatNumber(point.longitude, 4)}`}</small></div></li>)}</ol></div>
}

export function CalendarPreview({ data, api }: { data: unknown; api: ApiDemo }) {
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

export function SolarCyclePreview({ data }: { data: unknown }) {
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

export function SpaceWeatherPreview({ data }: { data: unknown }) {
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

export function FloodForecastPreview({ data }: { data: unknown }) {
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

export function FederalRegisterPreview({ data }: { data: unknown }) {
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

export function DeveloperFeedPreview({ data, api }: { data: unknown; api: ApiDemo }) {
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

export function SecurityCenterPreview({ data, api }: { data: unknown; api: ApiDemo }) {
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

export function ResearchLibraryPreview({ data, api }: { data: unknown; api: ApiDemo }) {
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
