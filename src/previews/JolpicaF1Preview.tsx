import { asRecord, CardEmpty, CardHeading, Facts, finite, numericText, rows, text } from './cardPrimitives'

type Dataset = 'drivers' | 'constructors' | 'races'

const link = (value: unknown) => {
  const candidate = text(value)
  if (!candidate) return undefined
  try {
    const url = new URL(candidate)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined
  } catch {
    return undefined
  }
}

const dateTime = (date: unknown, time: unknown) => {
  const d = text(date)
  const t = text(time)
  if (!d) return undefined
  return t ? `${d}T${t}` : d
}

const detectedDataset = (mrData: Record<string, unknown>): Dataset | undefined => {
  if (Object.keys(asRecord(mrData.DriverTable)).length) return 'drivers'
  if (Object.keys(asRecord(mrData.ConstructorTable)).length) return 'constructors'
  if (Object.keys(asRecord(mrData.RaceTable)).length) return 'races'
  return undefined
}

export function JolpicaF1Preview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const mrData = asRecord(root.MRData)
  const dataset = detectedDataset(mrData)
  const providerLimit = finite(mrData.limit)
  const providerTotal = finite(mrData.total)
  if (!dataset) return <CardEmpty domain="f1-season-catalog" title="Formula 1 season data unavailable" detail="Jolpica returned no supported DriverTable, ConstructorTable, or RaceTable payload." state="invalid"/>

  if (dataset === 'drivers') {
    const table = asRecord(mrData.DriverTable)
    const season = text(table.season)
    const drivers = rows(table.Drivers)
    if (!drivers.length) return <CardEmpty domain="f1-season-catalog" title="No Formula 1 drivers returned" detail="Jolpica returned an empty driver list for this season." state="empty"/>
    const first = drivers[0]
    return <div className="domain-card jolpica-f1-preview" data-domain-card="f1-season-catalog" data-result-state="ready" data-dataset="drivers" data-season={season} data-provider-total={providerTotal} data-provider-limit={providerLimit} data-primary-id={text(first.driverId)}>
      <CardHeading eyebrow="Jolpica · Formula 1 season drivers" title={`${season ?? 'Selected'} drivers`} description="Drivers that participated in the selected Formula 1 season. Jolpica documents this list as ordered alphabetically by driverId."><span className="domain-state">{drivers.length} returned · {providerTotal ?? drivers.length} total</span></CardHeading>
      <ol className="jolpica-season-list" aria-label="Formula 1 season drivers">{drivers.map((driver, index) => {
        const id = text(driver.driverId) ?? `driver-${index + 1}`
        const name = [text(driver.givenName), text(driver.familyName)].filter(Boolean).join(' ') || id
        const href = link(driver.url)
        return <li key={id} data-record-index={index + 1} data-driver-id={id} data-driver-code={text(driver.code)} data-driver-number={text(driver.permanentNumber)} data-nationality={text(driver.nationality)}>
          <header><div><small>Driver · {id}</small><h4>{name}</h4></div><span>{text(driver.code) ?? 'Code not supplied'}</span></header>
          <Facts items={[
            { label: 'Permanent number', value: text(driver.permanentNumber) ?? 'Not supplied' },
            { label: 'Nationality', value: text(driver.nationality) ?? 'Not supplied' },
            { label: 'Date of birth', value: text(driver.dateOfBirth) ? <time dateTime={text(driver.dateOfBirth)}>{text(driver.dateOfBirth)}</time> : 'Not supplied' },
          ]}/>
          {href && <a className="domain-reference-link" href={href} target="_blank" rel="noreferrer" aria-label={`Open ${name} reference`}>Reference</a>}
        </li>
      })}</ol>
    </div>
  }

  if (dataset === 'constructors') {
    const table = asRecord(mrData.ConstructorTable)
    const season = text(table.season)
    const constructors = rows(table.Constructors)
    if (!constructors.length) return <CardEmpty domain="f1-season-catalog" title="No Formula 1 constructors returned" detail="Jolpica returned an empty constructor list for this season." state="empty"/>
    const first = constructors[0]
    return <div className="domain-card jolpica-f1-preview" data-domain-card="f1-season-catalog" data-result-state="ready" data-dataset="constructors" data-season={season} data-provider-total={providerTotal} data-provider-limit={providerLimit} data-primary-id={text(first.constructorId)}>
      <CardHeading eyebrow="Jolpica · Formula 1 season constructors" title={`${season ?? 'Selected'} constructors`} description="Constructors that participated in the selected Formula 1 season, preserving stable provider IDs and nationality."><span className="domain-state">{constructors.length} returned · {providerTotal ?? constructors.length} total</span></CardHeading>
      <ol className="jolpica-season-list" aria-label="Formula 1 season constructors">{constructors.map((constructor, index) => {
        const id = text(constructor.constructorId) ?? `constructor-${index + 1}`
        const name = text(constructor.name) ?? id
        const href = link(constructor.url)
        return <li key={id} data-record-index={index + 1} data-constructor-id={id} data-nationality={text(constructor.nationality)}>
          <header><div><small>Constructor · {id}</small><h4>{name}</h4></div><span>{text(constructor.nationality) ?? 'Nationality not supplied'}</span></header>
          {href && <a className="domain-reference-link" href={href} target="_blank" rel="noreferrer" aria-label={`Open ${name} reference`}>Reference</a>}
        </li>
      })}</ol>
    </div>
  }

  const table = asRecord(mrData.RaceTable)
  const season = text(table.season)
  const races = rows(table.Races)
  if (!races.length) return <CardEmpty domain="f1-season-catalog" title="No Formula 1 races returned" detail="Jolpica returned an empty race list for this season." state="empty"/>
  const first = races[0]
  return <div className="domain-card jolpica-f1-preview" data-domain-card="f1-season-catalog" data-result-state="ready" data-dataset="races" data-season={season} data-provider-total={providerTotal} data-provider-limit={providerLimit} data-primary-id={text(first.round)}>
    <CardHeading eyebrow="Jolpica · Formula 1 season races" title={`${season ?? 'Selected'} race calendar`} description="Races are returned from earliest to latest. Race and session timestamps remain UTC when the provider supplies a Z-suffixed time."><span className="domain-state">{races.length} returned · {providerTotal ?? races.length} total</span></CardHeading>
    <ol className="jolpica-season-list" aria-label="Formula 1 season races">{races.map((race, index) => {
      const circuit = asRecord(race.Circuit)
      const location = asRecord(circuit.Location)
      const round = text(race.round) ?? String(index + 1)
      const raceName = text(race.raceName) ?? `Round ${round}`
      const start = dateTime(race.date, race.time)
      const latitude = finite(location.lat)
      const longitude = finite(location.long)
      const href = link(race.url)
      return <li key={`${round}-${raceName}`} data-record-index={index + 1} data-round={round} data-race-name={raceName} data-circuit-id={text(circuit.circuitId)} data-race-start={start} data-latitude={latitude} data-longitude={longitude}>
        <header><div><small>Round {round}</small><h4>{raceName}</h4></div><span>{start ?? 'Start not supplied'}</span></header>
        <Facts items={[
          { label: 'Circuit', value: text(circuit.circuitName) ?? 'Not supplied' },
          { label: 'Location', value: [text(location.locality), text(location.country)].filter(Boolean).join(', ') || 'Not supplied' },
          { label: 'Coordinates', value: latitude === undefined || longitude === undefined ? 'Not supplied' : `${numericText(latitude)}, ${numericText(longitude)}` },
          { label: 'Qualifying', value: dateTime(asRecord(race.Qualifying).date, asRecord(race.Qualifying).time) ?? 'Not supplied' },
          { label: 'Sprint', value: dateTime(asRecord(race.Sprint).date, asRecord(race.Sprint).time) ?? 'Not scheduled' },
        ]}/>
        {href && <a className="domain-reference-link" href={href} target="_blank" rel="noreferrer" aria-label={`Open ${raceName} reference`}>Reference</a>}
      </li>
    })}</ol>
    <p className="domain-note">This route is a season catalogue, not standings or race results. Driver, constructor, and race datasets are separate provider shapes selected from the same Request Lab control.</p>
  </div>
}
