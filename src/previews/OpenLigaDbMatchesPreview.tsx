import { asRecord, CardEmpty, CardHeading, Facts, finite, numericText, rows, text } from './cardPrimitives'

const finalKinds = ['AfterPenalties', 'AfterExtraTime', 'After90Minutes']

const matchResult = (value: unknown) => {
  const results = rows(value)
  return [...results].sort((a, b) => {
    const aKind = finalKinds.indexOf(text(a.resultTypeKind) ?? '')
    const bKind = finalKinds.indexOf(text(b.resultTypeKind) ?? '')
    if (aKind !== bKind) return (aKind < 0 ? 99 : aKind) - (bKind < 0 ? 99 : bKind)
    return (finite(b.resultOrderID) ?? -1) - (finite(a.resultOrderID) ?? -1)
  })[0]
}

const teamName = (value: unknown, fallback: string) => text(asRecord(value).teamName) ?? text(asRecord(value).shortName) ?? fallback

export function OpenLigaDbMatchesPreview({ data }: { data: unknown }) {
  const matches = rows(data)
  if (!matches.length) return <CardEmpty domain="football-matchday" title="No football matches returned" detail="OpenLigaDB returned no matches for this league, season, and matchday." state="empty"/>

  const first = matches[0]
  const leagueName = text(first.leagueName) ?? text(first.leagueShortcut) ?? 'Selected league'
  const season = finite(first.leagueSeason)
  const group = asRecord(first.group)
  const groupName = text(group.groupName) ?? (finite(group.groupOrderID) === undefined ? 'Selected matchday' : `Matchday ${numericText(finite(group.groupOrderID)!)}`)

  return <div
    className="domain-card openligadb-preview"
    data-domain-card="football-matchday"
    data-result-state="ready"
    data-league-id={finite(first.leagueId)}
    data-league-shortcut={text(first.leagueShortcut)}
    data-league-season={season}
    data-group-order-id={finite(group.groupOrderID)}
    data-provider-match-count={matches.length}
    data-primary-match-id={finite(first.matchID)}
  >
    <CardHeading
      eyebrow="OpenLigaDB · Matchday schedule and results"
      title={`${leagueName} · ${groupName}`}
      description="Each record keeps provider team identity, kickoff time, match status, and typed result semantics instead of flattening halftime and final results together."
    ><span className="domain-state">{matches.length} match{matches.length === 1 ? '' : 'es'} · season {season ?? 'not supplied'}</span></CardHeading>

    <ol className="sports-schedule-list" aria-label="OpenLigaDB football matches">{matches.map((match, index) => {
      const team1 = asRecord(match.team1)
      const team2 = asRecord(match.team2)
      const home = teamName(team1, 'Team 1')
      const away = teamName(team2, 'Team 2')
      const result = matchResult(match.matchResults)
      const resultKind = text(result?.resultTypeKind)
      const score1 = finite(result?.pointsTeam1)
      const score2 = finite(result?.pointsTeam2)
      const matchId = finite(match.matchID)
      const utc = text(match.matchDateTimeUTC)
      const local = text(match.matchDateTime)
      const finished = typeof match.matchIsFinished === 'boolean' ? match.matchIsFinished : undefined
      return <li
        key={matchId ?? index}
        data-match-index={index + 1}
        data-match-id={matchId}
        data-team1-id={finite(team1.teamId)}
        data-team2-id={finite(team2.teamId)}
        data-match-finished={finished === undefined ? undefined : String(finished)}
        data-kickoff-utc={utc}
        data-result-kind={resultKind}
        data-team1-score={score1}
        data-team2-score={score2}
      >
        <header>
          <div><small>Match {matchId === undefined ? 'ID not supplied' : numericText(matchId)}</small><h4>{home} <span aria-hidden="true">vs</span><span className="sr-only">versus</span> {away}</h4></div>
          <span>{finished === true ? 'Finished' : finished === false ? 'Scheduled / in progress' : 'Status not supplied'}</span>
        </header>
        <div className="sports-score" aria-label={`${home} versus ${away} result`}>
          <strong>{home}</strong><b>{score1 === undefined ? '—' : numericText(score1)}</b>
          <span aria-hidden="true">–</span><span className="sr-only">to</span>
          <b>{score2 === undefined ? '—' : numericText(score2)}</b><strong>{away}</strong>
        </div>
        <Facts items={[
          { label: 'Kickoff · UTC', value: utc ? <time dateTime={utc}>{utc}</time> : 'Not supplied' },
          { label: 'Provider local kickoff', value: local ?? 'Not supplied' },
          { label: 'Provider time zone', value: text(match.timeZoneID) ?? 'Not supplied' },
          { label: 'Result type', value: resultKind ?? 'Not supplied' },
          { label: 'Result label', value: text(result?.resultName) ?? 'Not supplied' },
          { label: 'Goals returned', value: numericText(rows(match.goals).length) },
        ]}/>
      </li>
    })}</ol>
    <p className="domain-note">OpenLigaDB can return multiple typed results for one match, such as <code>HalfTime</code> and <code>After90Minutes</code>. The score above uses the most final typed result present; Raw JSON retains every provider result and goal event.</p>
  </div>
}
