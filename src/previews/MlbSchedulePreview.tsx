import { asRecord, CardEmpty, CardHeading, Facts, finite, numericText, rows, text } from './cardPrimitives'

const recordLabel = (side: Record<string, unknown>) => {
  const record = asRecord(side.leagueRecord)
  const wins = finite(record.wins)
  const losses = finite(record.losses)
  return wins === undefined || losses === undefined ? 'Not supplied' : `${numericText(wins)}–${numericText(losses)}`
}

export function MlbSchedulePreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const dateBlocks = rows(root.dates)
  const games = dateBlocks.flatMap((dateBlock) => rows(dateBlock.games).map((game) => ({ game, dateBlock })))
  if (!games.length) return <CardEmpty domain="baseball-schedule" title="No MLB games returned" detail="MLB Stats returned no scheduled games for the requested date." state="empty"/>

  const firstDate = text(games[0].dateBlock.date) ?? text(games[0].game.officialDate) ?? 'Selected date'
  const totalGames = finite(root.totalGames) ?? games.length
  const inProgress = finite(root.totalGamesInProgress)
  const firstGame = games[0].game

  return <div
    className="domain-card mlb-schedule-preview"
    data-domain-card="baseball-schedule"
    data-result-state="ready"
    data-schedule-date={firstDate}
    data-provider-total-games={totalGames}
    data-provider-games-in-progress={inProgress}
    data-primary-game-pk={finite(firstGame.gamePk)}
  >
    <CardHeading
      eyebrow="MLB Stats · Schedule"
      title={`${firstDate} MLB schedule`}
      description="Games preserve provider game identity, UTC start time, status, home/away identity, venue, series context, and scores only when the schedule response supplies them."
    ><span className="domain-state">{numericText(totalGames)} game{totalGames === 1 ? '' : 's'}{inProgress === undefined ? '' : ` · ${numericText(inProgress)} in progress`}</span></CardHeading>

    <ol className="sports-schedule-list" aria-label="MLB schedule games">{games.map(({ game }, index) => {
      const teams = asRecord(game.teams)
      const away = asRecord(teams.away)
      const home = asRecord(teams.home)
      const awayTeam = asRecord(away.team)
      const homeTeam = asRecord(home.team)
      const status = asRecord(game.status)
      const venue = asRecord(game.venue)
      const awayName = text(awayTeam.name) ?? 'Away team'
      const homeName = text(homeTeam.name) ?? 'Home team'
      const awayScore = finite(away.score)
      const homeScore = finite(home.score)
      const gamePk = finite(game.gamePk)
      const gameDate = text(game.gameDate)
      const detailedState = text(status.detailedState) ?? text(status.abstractGameState) ?? 'Status not supplied'
      return <li
        key={gamePk ?? index}
        data-game-index={index + 1}
        data-game-pk={gamePk}
        data-away-team-id={finite(awayTeam.id)}
        data-home-team-id={finite(homeTeam.id)}
        data-game-status={detailedState}
        data-game-start={gameDate}
        data-away-score={awayScore}
        data-home-score={homeScore}
      >
        <header>
          <div><small>Game {gamePk === undefined ? 'ID not supplied' : numericText(gamePk)} · {text(game.seriesDescription) ?? 'Series not supplied'}</small><h4>{awayName} <span aria-hidden="true">at</span><span className="sr-only">at</span> {homeName}</h4></div>
          <span>{detailedState}</span>
        </header>
        <div className="sports-score" aria-label={`${awayName} at ${homeName} score`}>
          <strong>{awayName}</strong><b>{awayScore === undefined ? '—' : numericText(awayScore)}</b>
          <span aria-hidden="true">–</span><span className="sr-only">to</span>
          <b>{homeScore === undefined ? '—' : numericText(homeScore)}</b><strong>{homeName}</strong>
        </div>
        <Facts items={[
          { label: 'Start · UTC', value: gameDate ? <time dateTime={gameDate}>{gameDate}</time> : 'Not supplied' },
          { label: 'Venue', value: text(venue.name) ?? 'Not supplied' },
          { label: 'Away record · W–L', value: recordLabel(away) },
          { label: 'Home record · W–L', value: recordLabel(home) },
          { label: 'Series game', value: finite(game.seriesGameNumber) === undefined || finite(game.gamesInSeries) === undefined ? 'Not supplied' : `${numericText(finite(game.seriesGameNumber)!)} of ${numericText(finite(game.gamesInSeries)!)}` },
          { label: 'Scheduled innings', value: finite(game.scheduledInnings) === undefined ? 'Not supplied' : numericText(finite(game.scheduledInnings)!) },
        ]}/>
      </li>
    })}</ol>
    <p className="domain-note">This is MLB's schedule surface, not play-by-play. A dash means the provider did not supply a score for that game state; the card does not invent a 0–0 score for scheduled games.</p>
  </div>
}
