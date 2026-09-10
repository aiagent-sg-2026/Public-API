import './specializedCatalogCards.css'
import type { CSSProperties } from 'react'
import type { ApiDemo } from '../apiCatalog'
import { DateList, type DateListItem } from './DateList'
import { Sparkline } from './ChartPrimitives'
import { SemanticCards, type SemanticCard } from './SemanticCards'
import { cleanText, compactNumber, dateParts, findPreviewRecords, formatNumber, isRecord, numberValue, previewLabel, previewValue, recordArray, recordValue, textArray, textValue, timeLabel } from './previewData'

export function CountryPreview({ data, api }: { data: unknown; api: ApiDemo }) {
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

export function FuelPricePreview({ data }: { data: unknown }) {
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

export function MarineForecastPreview({ data }: { data: unknown }) {
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

export function NobelPrizePreview({ data }: { data: unknown }) {
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

export function LichessLeaderboardPreview({ data }: { data: unknown }) {
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

export function ChessRatingsPreview({ data }: { data: unknown }) {
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

export function OpenF1SessionsPreview({ data }: { data: unknown }) {
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

export function LaunchSchedulePreview({ data }: { data: unknown }) {
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

export function WiktionaryEntryPreview({ data }: { data: unknown }) {
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

export function PoetryReaderPreview({ data }: { data: unknown }) {
  const poems = recordArray(data).slice(0, 4)
  if (!poems.length) return <div className="weather-empty"><strong>Poems unavailable</strong><span>PoetryDB did not return a poem for this author.</span></div>
  const first = poems[0]
  return <div className="dictionary-preview poetry-preview"><div className="dictionary-hero"><div><span>Public-domain reading room</span><strong>{cleanText(first.author) ?? 'Selected poet'}</strong><b>{poems.length} poem{poems.length === 1 ? '' : 's'} in this reading</b></div><span aria-hidden="true">¶</span></div><div className="dictionary-meanings">{poems.map((poem, index) => <section key={`${poem.title}-${index}`}><header><span>{index + 1}</span><h3>{cleanText(poem.title) ?? `Poem ${index + 1}`}</h3></header><ol><li><p>{textArray(poem.lines).slice(0, 6).join(' / ') || 'Poem lines unavailable'}</p><blockquote>{previewValue(poem.linecount)} lines · {cleanText(poem.author) ?? 'Unknown author'}</blockquote></li></ol></section>)}</div></div>
}

export function StarWarsPeoplePreview({ data }: { data: unknown }) {
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

export function AnimeQuotePreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const quote = isRecord(root.data) ? root.data : {}
  const anime = isRecord(quote.anime) ? quote.anime : {}
  const character = isRecord(quote.character) ? quote.character : {}
  const content = cleanText(quote.content)
  if (!content) return <div className="weather-empty"><strong>Anime quote unavailable</strong><span>AnimeChan did not return quote content.</span></div>
  return <div className="dictionary-preview anime-quote-preview"><div className="dictionary-hero"><div><span>Anime quote stage</span><strong>{cleanText(anime.name) ?? 'Anime series'}</strong><b>{cleanText(character.name) ?? 'Character unavailable'}</b></div><span aria-hidden="true">“</span></div><div className="dictionary-meanings"><section><header><span>AQ</span><h3>{cleanText(character.name) ?? 'Featured quote'}</h3></header><ol><li><p>“{content}”</p><blockquote>{cleanText(anime.altName) ?? cleanText(anime.name) ?? 'AnimeChan public quote'}</blockquote></li></ol></section></div></div>
}

export function BrazilPostcodePreview({ data }: { data: unknown }) {
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

export function DndSpellPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  if (!Object.keys(root).length) return <div className="weather-empty"><strong>Spell unavailable</strong><span>No matching D&amp;D 5e spell was returned.</span></div>
  const school = isRecord(root.school) ? cleanText(root.school.name) : undefined
  const classes = recordArray(root.classes).map((entry) => cleanText(entry.name)).filter((value): value is string => Boolean(value))
  return <div className="dictionary-preview dnd-spell-preview"><div className="dictionary-hero"><div><span>{school ?? 'D&amp;D 5e'} spell · Level {previewValue(root.level)}</span><strong>{cleanText(root.name) ?? 'Spell'}</strong><b>{cleanText(root.range) ?? 'Range unavailable'} · {root.concentration ? 'Concentration' : 'No concentration'}</b></div><span aria-hidden="true">✦</span></div><div className="dictionary-meanings"><section><header><span>1</span><h3>Effect</h3></header><ol>{textArray(root.desc).map((paragraph, index) => <li key={index}><p>{paragraph}</p></li>)}</ol>{textArray(root.higher_level).length ? <footer><b>At higher levels</b><span>{textArray(root.higher_level).join(' ')}</span></footer> : null}</section></div><dl className="country-facts"><div><dt>Casting time</dt><dd>{previewValue(root.casting_time)}</dd></div><div><dt>Components</dt><dd>{textArray(root.components).join(', ') || '—'}</dd></div><div><dt>Duration</dt><dd>{previewValue(root.duration)}</dd></div><div><dt>Classes</dt><dd>{classes.join(', ') || '—'}</dd></div></dl></div>
}

type SsotStat = { label: string; value: string; note?: string }

export function SsotStatStrip({ eyebrow, title, stats }: { eyebrow: string; title: string; stats: SsotStat[] }) {
  return <div className="ssot-stat-strip"><div className="ssot-stat-heading"><small>{eyebrow}</small><strong>{title}</strong></div><div className="ssot-stat-grid">{stats.map((stat) => <article key={stat.label}><small>{stat.label}</small><strong>{stat.value}</strong>{stat.note && <span>{stat.note}</span>}</article>)}</div></div>
}

export function CarparkAvailabilityPreview({ data }: { data: unknown }) {
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

export function MetMuseumSearchPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const ids = Array.isArray(root.objectIDs) ? root.objectIDs.filter((value): value is number => typeof value === 'number') : []
  const total = numberValue(root.total) ?? ids.length
  return <div className="ssot-stack"><SsotStatStrip eyebrow="The Met collection index" title="Singapore search results" stats={[
    { label: 'Matching objects', value: compactNumber(total), note: 'collection records' },
    { label: 'IDs returned', value: compactNumber(ids.length), note: 'ready for object lookup' },
  ]}/><div className="ssot-id-grid" aria-label="Met Museum object IDs">{ids.slice(0, 18).map((id) => <code key={id}>{id}</code>)}</div></div>
}

export function NhtsaMakesPreview({ data }: { data: unknown }) {
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

export function GbifTaxonomyPreview({ data }: { data: unknown }) {
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

export function GoModuleVersionsPreview({ data }: { data: unknown }) {
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

export function JsDelivrPackagePreview({ api, data, requestUrl }: { api: ApiDemo; data: unknown; requestUrl?: string }) {
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

export { DatamuseWordPreview } from './DatamuseWordPreview'
export { HuggingFaceModelsPreview } from './HuggingFaceModelsPreview'
export { IconifySearchPreview } from './IconifySearchPreview'
export { HomebrewPackagePreview } from './HomebrewPackagePreview'
export { Open5eMonsterPreview } from './Open5eMonsterPreview'
export { NewtonMathPreview } from './NewtonMathPreview'
export { IpifyPublicIpPreview } from './IpifyPublicIpPreview'
export { CatFactPreview } from './CatFactPreview'

export function GeneratedImagePreview({ api, requestUrl }: { api: ApiDemo; requestUrl?: string }) {
  if (!requestUrl) return <div className="weather-empty"><strong>Image unavailable</strong><span>No request URL was captured for this response.</span></div>
  return <div className="media-preview single"><article><img src={requestUrl} alt={api.name} loading="lazy"/><div><small>{api.category}</small><h3>{api.name}</h3><p>Rendered directly from the live request URL.</p></div></article></div>
}
