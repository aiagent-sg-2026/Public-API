import './specializedCatalogCards.css'
import type { CSSProperties } from 'react'
import type { ApiDemo } from '../apiCatalog'
import type { ExecutedRequestContext } from '../useApiRequestRuntime'
import { Sparkline } from './ChartPrimitives'
import { SemanticCards, type SemanticCard } from './SemanticCards'
import { CardEmpty } from './cardPrimitives'
import { cleanText, compactNumber, dateParts, formatNumber, isRecord, numberValue, previewLabel, previewValue, recordArray, recordValue, textArray } from './previewData'
import { nonNegativeSafeInteger, optionalTrimmedText, positiveSafeInteger, trimmedText } from './semanticValidation'

export { MarineForecastPreview } from './OpenMeteoMarinePreview'
export { MetMuseumSearchPreview } from './MetMuseumSearchPreview'
export { MetMuseumObjectPreview } from './MetMuseumObjectPreview'
export { LaunchSchedulePreview } from './LaunchLibraryUpcomingPreview'

type CountryRequestIdentity = { code: string; valid: true } | { valid: false }
type CountryRequestTransport = { request?: CountryRequestIdentity; valid: boolean; bound: boolean }

const countryRequestIdentity = (requestUrl?: string): CountryRequestIdentity | undefined => {
  if (!requestUrl) return undefined
  try {
    const url = new URL(requestUrl)
    const match = /^\/v2\/country\/([^/]+)$/.exec(url.pathname)
    const queryKeys = [...url.searchParams.keys()]
    if (url.protocol !== 'https:' || url.origin !== 'https://api.worldbank.org' || url.username || url.password || url.hash || !match || queryKeys.length !== 1 || queryKeys[0] !== 'format' || url.searchParams.get('format') !== 'json') return { valid: false }
    const code = decodeURIComponent(match[1]).trim().toUpperCase()
    return /^[A-Z]{2,3}$/.test(code) ? { code, valid: true } : { valid: false }
  } catch {
    return { valid: false }
  }
}

const countryRequestTransport = (requestUrl?: string, executedRequest?: ExecutedRequestContext): CountryRequestTransport => {
  const displayed = countryRequestIdentity(requestUrl)
  if (requestUrl && displayed?.valid === false) return { request: displayed, valid: false, bound: false }
  if (!executedRequest) return { request: displayed, valid: true, bound: false }
  if (executedRequest.method.toUpperCase() !== 'GET' || executedRequest.body !== undefined || (requestUrl !== undefined && executedRequest.url !== requestUrl)) {
    return { request: displayed, valid: false, bound: false }
  }
  const executed = countryRequestIdentity(executedRequest.url)
  if (!executed?.valid || (displayed?.valid && displayed.code !== executed.code)) return { request: executed ?? displayed, valid: false, bound: false }
  return { request: executed, valid: true, bound: true }
}

const nestedCountryLabel = (value: unknown) => {
  if (value === undefined || value === null) return { malformed: false as const, value: undefined }
  if (!isRecord(value)) return { malformed: true as const, value: undefined }
  const label = optionalTrimmedText(value.value)
  return { malformed: label.malformed, value: label.value }
}

const countryCoordinate = (value: unknown, min: number, max: number) => {
  if (value === undefined || value === null) return { malformed: false as const, value: undefined }
  if (typeof value !== 'string' || !/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value.trim())) return { malformed: true as const, value: undefined }
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric >= min && numeric <= max
    ? { malformed: false as const, value: value.trim() }
    : { malformed: true as const, value: undefined }
}

export function CountryPreview({ data, api, requestUrl, executedRequest }: { data: unknown; api: ApiDemo; requestUrl?: string; executedRequest?: ExecutedRequestContext }) {
  const transport = countryRequestTransport(requestUrl, executedRequest)
  const request = transport.request
  const envelopeValid = Array.isArray(data) && data.length === 2 && isRecord(data[0]) && Array.isArray(data[1])
  const metadata = envelopeValid ? data[0] as Record<string, unknown> : {}
  const providerRows: unknown[] = envelopeValid ? data[1] as unknown[] : []
  const page = positiveSafeInteger(metadata.page)
  const pages = positiveSafeInteger(metadata.pages)
  const total = nonNegativeSafeInteger(metadata.total)
  const perPage = optionalTrimmedText(metadata.per_page)
  const metadataValid = envelopeValid && page === 1 && pages === 1 && total !== undefined && !perPage.malformed && Boolean(perPage.value && /^[1-9][0-9]*$/.test(perPage.value)) && total === providerRows.length && providerRows.length <= 1
  const country = providerRows.length === 1 && isRecord(providerRows[0]) ? providerRows[0] : undefined
  const providerCode = country ? trimmedText(country.id)?.toUpperCase() : undefined
  const providerIso2 = country ? trimmedText(country.iso2Code)?.toUpperCase() : undefined
  const name = country ? trimmedText(country.name) : undefined
  const providerIdentityValid = Boolean(providerCode && /^[A-Z]{3}$/.test(providerCode) && providerIso2 && /^[A-Z]{2}$/.test(providerIso2) && name)
  const identityMatch = request?.valid && providerIdentityValid
    ? request.code === (request.code.length === 2 ? providerIso2 : providerCode)
    : request?.valid === false ? false : undefined

  const region = nestedCountryLabel(country?.region)
  const income = nestedCountryLabel(country?.incomeLevel)
  const lending = nestedCountryLabel(country?.lendingType)
  const capital = optionalTrimmedText(country?.capitalCity)
  const latitude = countryCoordinate(country?.latitude, -90, 90)
  const longitude = countryCoordinate(country?.longitude, -180, 180)
  const optionalMalformed = region.malformed || income.malformed || lending.malformed || capital.malformed || latitude.malformed || longitude.malformed
  const responseValid = metadataValid && (providerRows.length === 0 || providerIdentityValid)
  const requestValid = request?.valid !== false
  const semanticIdentityMatch = transport.bound ? identityMatch : request?.valid === false ? false : undefined
  const structurallyInvalid = !responseValid || !transport.valid || !requestValid || identityMatch === false
  const state = structurallyInvalid
    ? 'invalid' as const
    : providerRows.length === 0
      ? transport.bound ? 'empty' as const : 'partial' as const
      : optionalMalformed || !transport.bound
        ? 'partial' as const
        : 'ready' as const
  const evidence = {
    'data-request-bound': String(transport.bound),
    'data-request-contract': 'exact-world-bank-country-v2',
    'data-requested-country-code': request?.valid ? request.code : undefined,
    'data-provider-country-code': providerCode,
    'data-provider-iso2-code': providerIso2,
    'data-identity-match': semanticIdentityMatch === undefined ? 'unbound' : String(semanticIdentityMatch),
    'data-contract-valid': String(state === 'ready' || state === 'empty'),
    'data-provider-record-count': String(providerRows.length),
  }

  if (state === 'invalid') return <div className="domain-card domain-empty" data-domain-card="country-profile" data-result-state="invalid" {...evidence}>
    <h3>Invalid World Bank country response</h3>
    <p>{!transport.valid
      ? 'The successful response was not bound to the supported exact bodyless GET World Bank country request.'
      : identityMatch === false && request?.valid && providerIdentityValid
        ? 'The returned country identity does not match the country in the executed World Bank request, so country details are withheld.'
        : request?.valid === false
          ? 'The executed request URL is not the supported World Bank V2 single-country JSON endpoint.'
          : 'The HTTP-success payload does not match the documented World Bank V2 country response envelope.'}</p>
  </div>

  if (state === 'empty') return <div className="domain-card domain-empty" data-domain-card="country-profile" data-result-state="empty" {...evidence}><h3>Country profile unavailable</h3><p>World Bank returned a valid empty country collection for this exact executed request.</p></div>
  if (state === 'partial' && providerRows.length === 0) return <div className="domain-card domain-empty" data-domain-card="country-profile" data-result-state="partial" {...evidence}><h3>Unbound country response</h3><p>The empty response is coherent, but executed transport identity is unavailable, so semantic emptiness is not trusted.</p></div>

  const code = providerIso2 ?? providerCode ?? api.monogram
  const facts = [
    ['Capital city', capital.value ?? '—'],
    ['Income group', income.value ?? '—'],
    ['Lending type', lending.value ?? '—'],
    ['Coordinates', latitude.value && longitude.value ? `${latitude.value}, ${longitude.value}` : '—'],
  ]
  return <div className="country-preview" data-domain-card="country-profile" data-result-state={state} {...evidence}>
    <div className="country-hero"><span className="country-code">{code}</span><div><small>World profile</small><h3>{name}</h3><p><span>●</span> {region.value ?? 'Region unavailable'}</p></div><span className="country-globe" aria-hidden="true">◎</span></div>
    {state === 'partial' && <p className="domain-note">{!transport.bound ? 'The country record is structurally usable, but executed-request identity is unavailable, so this result is not marked ready.' : 'Some optional World Bank country fields were malformed and have been withheld.'}</p>}
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
  const status = trimmedText(root.status)
  const quote = isRecord(root.data) ? root.data : undefined
  const anime = quote && isRecord(quote.anime) ? quote.anime : undefined
  const character = quote && isRecord(quote.character) ? quote.character : undefined
  const rawContent = quote ? trimmedText(quote.content) : undefined
  const content = rawContent ? cleanText(rawContent) : undefined
  const animeId = anime ? positiveSafeInteger(anime.id) : undefined
  const animeName = anime ? trimmedText(anime.name) : undefined
  const altName = optionalTrimmedText(anime?.altName)
  const characterId = character ? positiveSafeInteger(character.id) : undefined
  const characterName = character ? trimmedText(character.name) : undefined
  const contractValid = status === 'success' && Boolean(content && animeId && animeName && characterId && characterName) && !altName.malformed

  if (!contractValid) return <div className="domain-card domain-empty" data-domain-card="anime-quote" data-result-state="invalid" data-provider-status={status ?? ''} data-contract-valid="false"><h3>Anime quote unavailable</h3><p>AnimeChan returned a response that does not match its documented Quote contract.</p></div>

  return <div className="dictionary-preview anime-quote-preview" data-domain-card="anime-quote" data-result-state="ready" data-provider-status={status} data-contract-valid="true" data-anime-id={animeId} data-character-id={characterId}><div className="dictionary-hero"><div><span>Anime quote stage</span><strong>{animeName}</strong><b>{characterName}</b></div><span aria-hidden="true">“</span></div><div className="dictionary-meanings"><section><header><span>AQ</span><h3>{characterName}</h3></header><ol><li><p>“{content}”</p><blockquote>{altName.value ?? animeName}</blockquote></li></ol></section></div></div>
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

const GO_MODULE_VERSION = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+incompatible)?$/
const GO_PSEUDO_VERSION = /-(?:[0-9A-Za-z-]+\.)*\d{14}-[0-9A-Za-z]{12,}(?:\+incompatible)?$/

type GoModuleVersion = { raw: string; major: bigint; minor: bigint; patch: bigint; prerelease: string[] }

const parseGoModuleVersion = (value: unknown): GoModuleVersion | undefined => {
  if (typeof value !== 'string' || value.trim() !== value || GO_PSEUDO_VERSION.test(value)) return undefined
  const match = GO_MODULE_VERSION.exec(value)
  if (!match) return undefined
  const prerelease = match[4]?.split('.') ?? []
  if (prerelease.some((part) => /^\d+$/.test(part) && part.length > 1 && part.startsWith('0'))) return undefined
  return { raw: value, major: BigInt(match[1]), minor: BigInt(match[2]), patch: BigInt(match[3]), prerelease }
}

const compareGoPrerelease = (left: string[], right: string[]): number => {
  if (!left.length && !right.length) return 0
  if (!left.length) return 1
  if (!right.length) return -1
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const a = left[index]
    const b = right[index]
    if (a === undefined) return -1
    if (b === undefined) return 1
    if (a === b) continue
    const aNumeric = /^\d+$/.test(a)
    const bNumeric = /^\d+$/.test(b)
    if (aNumeric && bNumeric) return BigInt(a) < BigInt(b) ? -1 : 1
    if (aNumeric !== bNumeric) return aNumeric ? -1 : 1
    return a < b ? -1 : 1
  }
  return 0
}

const compareGoModuleVersions = (left: GoModuleVersion, right: GoModuleVersion): number => {
  for (const key of ['major', 'minor', 'patch'] as const) {
    if (left[key] !== right[key]) return left[key] < right[key] ? -1 : 1
  }
  return compareGoPrerelease(left.prerelease, right.prerelease)
}

const escapeGoProxyPath = (value: string): string =>
  [...value].map((character) => /[A-Z]/.test(character) ? `!${character.toLowerCase()}` : character).join('')

const unescapeGoProxyPath = (value: string): string | undefined => {
  let result = ''
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if (character !== '!') { result += character; continue }
    const next = value[index + 1]
    if (!next || !/[a-z]/.test(next)) return undefined
    result += next.toUpperCase()
    index += 1
  }
  return result || undefined
}

const requestedGoModule = (requestUrl?: string): string | undefined => {
  if (!requestUrl) return undefined
  try {
    const url = new URL(requestUrl)
    if (url.protocol !== 'https:' || url.hostname !== 'proxy.golang.org' || url.port || url.username || url.password || url.search || url.hash) return undefined
    const suffix = '/@v/list'
    if (!url.pathname.startsWith('/') || !url.pathname.endsWith(suffix)) return undefined
    const encodedPath = url.pathname.slice(1, -suffix.length)
    if (!encodedPath) return undefined
    const escapedPath = decodeURIComponent(encodedPath)
    const modulePath = unescapeGoProxyPath(escapedPath)
    if (!modulePath || escapeGoProxyPath(modulePath) !== escapedPath) return undefined
    const canonicalPath = encodeURIComponent(escapedPath).replace(/%2F/gi, '/')
    const canonical = `https://proxy.golang.org/${canonicalPath}/@v/list`
    return requestUrl === canonical ? modulePath : undefined
  } catch { return undefined }
}

const GO_MODULE_REQUEST_CONTRACT = 'exact-go-module-version-list-v2'

const bindGoModuleRequest = (requestUrl?: string, executedRequest?: ExecutedRequestContext) => {
  const displayedModule = requestedGoModule(requestUrl)
  if (requestUrl && !displayedModule) return { module: undefined, bound: false, invalid: true }
  if (!executedRequest) return { module: displayedModule, bound: false, invalid: false }
  if (executedRequest.method.toUpperCase() !== 'GET' || executedRequest.body !== undefined || !requestUrl || executedRequest.url !== requestUrl) {
    return { module: displayedModule, bound: false, invalid: true }
  }
  const executedModule = requestedGoModule(executedRequest.url)
  if (!executedModule || executedModule !== displayedModule) return { module: executedModule ?? displayedModule, bound: false, invalid: true }
  return { module: executedModule, bound: true, invalid: false }
}

export function GoModuleVersionsPreview({ data, requestUrl, executedRequest }: { data: unknown; requestUrl?: string; executedRequest?: ExecutedRequestContext }) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return <CardEmpty domain="go-module-versions" title="Invalid Go module proxy response" detail="The parsed HTTP-success response was not the expected Go module version-list object." state="invalid"/>
  }
  const root = data as Record<string, unknown>
  if (!Array.isArray(root.versions)) {
    return <CardEmpty domain="go-module-versions" title="Invalid Go module proxy response" detail="The parsed response did not contain the expected versions array." state="invalid"/>
  }
  const binding = bindGoModuleRequest(requestUrl, executedRequest)
  if (binding.invalid) {
    return <CardEmpty domain="go-module-versions" title="Invalid Go module request identity" detail="The successful response is not bound to the exact canonical bodyless GET proxy.golang.org module version-list request." state="invalid"/>
  }
  const requestModule = binding.module

  const providerVersionCount = root.versions.length
  const trustedVersions: GoModuleVersion[] = []
  const seen = new Set<string>()
  let invalidVersionCount = 0
  for (const candidate of root.versions) {
    const parsed = parseGoModuleVersion(candidate)
    if (!parsed || seen.has(parsed.raw)) { invalidVersionCount += 1; continue }
    seen.add(parsed.raw)
    trustedVersions.push(parsed)
  }

  if (providerVersionCount === 0) {
    const state = binding.bound ? 'empty' : 'partial'
    return <div className="domain-card domain-empty" data-domain-card="go-module-versions" data-ssot-reference="go-module-proxy" data-result-state={state} data-request-contract={GO_MODULE_REQUEST_CONTRACT} data-request-bound={String(binding.bound)} data-requested-module={requestModule} data-provider-version-count="0" data-valid-version-count="0" data-invalid-version-count="0"><h3>No tagged module versions listed</h3><p>{binding.bound && requestModule ? `The Go module proxy returned a valid exact-request-bound empty @v/list response for ${requestModule}.` : 'The parsed @v/list response is empty, but executed-request identity is unavailable.'}</p></div>
  }
  if (!trustedVersions.length) {
    return <CardEmpty domain="go-module-versions" title="Invalid Go module version list" detail="None of the returned @v/list entries are trustworthy canonical tagged module versions." state="invalid"/>
  }

  const sorted = [...trustedVersions].sort((left, right) => compareGoModuleVersions(right, left))
  const highest = sorted[0]?.raw
  const releaseCount = trustedVersions.filter((version) => version.prerelease.length === 0).length
  const prereleaseCount = trustedVersions.length - releaseCount
  const state = binding.bound && requestModule && invalidVersionCount === 0 ? 'ready' : 'partial'

  return <div className="ssot-stack" data-domain-card="go-module-versions" data-ssot-reference="go-module-proxy" data-result-state={state} data-request-contract={GO_MODULE_REQUEST_CONTRACT} data-requested-module={requestModule} data-request-bound={String(binding.bound)} data-provider-version-count={providerVersionCount} data-valid-version-count={trustedVersions.length} data-invalid-version-count={invalidVersionCount} data-release-version-count={releaseCount} data-prerelease-version-count={prereleaseCount} data-highest-listed-version={highest}>
    <SsotStatStrip eyebrow="Official Go module proxy" title="Published module versions" stats={[
      { label: 'Trusted versions', value: compactNumber(trustedVersions.length), note: `${invalidVersionCount} invalid hidden` },
      { label: 'Tagged releases', value: compactNumber(releaseCount), note: `${prereleaseCount} prerelease${prereleaseCount === 1 ? '' : 's'}` },
      { label: 'Highest listed', value: highest ?? '—', note: 'semantic version order' },
    ]}/>
    {state === 'partial' && <p className="domain-note">{!binding.bound ? 'The version list is structurally valid, but executed-request identity is unavailable, so it cannot be bound to a specific module lookup.' : 'Some returned version lines were malformed or inconsistent with the @v/list tagged-version contract, so only validated versions are shown.'}</p>}
    <div className="ssot-version-grid">{sorted.slice(0, 24).map((version) => <code key={version.raw}>{version.raw}</code>)}</div>
  </div>
}


export { DatamuseWordPreview } from './DatamuseWordPreview'
export { IconifySearchPreview } from './IconifySearchPreview'
export { Open5eMonsterPreview } from './Open5eMonsterPreview'
export { NewtonMathPreview } from './NewtonMathPreview'
export { IpifyPublicIpPreview } from './IpifyPublicIpPreview'
export { CatFactPreview } from './CatFactPreview'

export function GeneratedImagePreview({ api, requestUrl }: { api: ApiDemo; requestUrl?: string }) {
  if (!requestUrl) return <div className="weather-empty"><strong>Image unavailable</strong><span>No request URL was captured for this response.</span></div>
  return <div className="media-preview single"><article><img src={requestUrl} alt={api.name} loading="lazy"/><div><small>{api.category}</small><h3>{api.name}</h3><p>Rendered directly from the live request URL.</p></div></article></div>
}

export { OpenMeteoSeasonalPreview } from './OpenMeteoSeasonalPreview'

export { NhtsaSafetyRatingsPreview } from './NhtsaSafetyRatingsPreview'

export { SingStatCpiPreview } from './SingStatCpiPreview'

export { OpenAlexWorksPreview } from './OpenAlexWorksPreview'

export { OecdCliPreview } from './OecdCliPreview'
