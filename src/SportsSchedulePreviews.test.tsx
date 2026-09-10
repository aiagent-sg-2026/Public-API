import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const openLiga = apiCatalog.find((candidate) => candidate.id === 'openligadb-matches')
const mlb = apiCatalog.find((candidate) => candidate.id === 'mlb-stats-api')
if (!openLiga || !mlb) throw new Error('Missing sports schedule fixtures')

describe('sports schedule semantic previews', () => {
  afterEach(cleanup)

  it('keeps OpenLigaDB halftime and final result semantics distinct', () => {
    render(<ResponseDemoPreview api={openLiga} data={[{
      matchID: 77257,
      matchDateTime: '2025-08-23T15:30:00',
      matchDateTimeUTC: '2025-08-23T13:30:00Z',
      timeZoneID: 'W. Europe Standard Time',
      leagueId: 4821,
      leagueName: '1. Fußball-Bundesliga 2025/2026',
      leagueSeason: 2025,
      leagueShortcut: 'bl1',
      group: { groupName: '1. Spieltag', groupOrderID: 1 },
      team1: { teamId: 6, teamName: 'Bayer 04 Leverkusen' },
      team2: { teamId: 175, teamName: 'TSG Hoffenheim' },
      matchIsFinished: true,
      matchResults: [
        { resultName: 'Halbzeit', pointsTeam1: 1, pointsTeam2: 1, resultOrderID: 1, resultTypeKind: 'HalfTime' },
        { resultName: 'Endergebnis', pointsTeam1: 1, pointsTeam2: 2, resultOrderID: 2, resultTypeKind: 'After90Minutes' },
      ],
      goals: [{ goalID: 1 }, { goalID: 2 }, { goalID: 3 }],
    }]}/>)

    const preview = screen.getByRole('region', { name: 'OpenLigaDB' })
    expect(preview).toHaveAttribute('data-preview-layout', 'football-matchday')
    const match = preview.querySelector('[data-match-id="77257"]')
    expect(match).toHaveAttribute('data-result-kind', 'After90Minutes')
    expect(match).toHaveAttribute('data-team1-score', '1')
    expect(match).toHaveAttribute('data-team2-score', '2')
    expect(preview).toHaveTextContent('Bayer 04 Leverkusen')
    expect(preview).toHaveTextContent('TSG Hoffenheim')
    expect(preview).toHaveTextContent('Result typeAfter90Minutes')
    expect(preview).toHaveTextContent('Goals returned3')
    expect(preview).toHaveTextContent('Raw JSON retains every provider result')
    expect(preview).not.toHaveTextContent('OpenLigaDB record 1')
  })

  it('does not invent zero scores for scheduled MLB games', () => {
    render(<ResponseDemoPreview api={mlb} data={{
      totalGames: 1,
      totalGamesInProgress: 0,
      dates: [{
        date: '2026-09-09',
        games: [{
          gamePk: 824226,
          gameDate: '2026-09-09T17:10:00Z',
          officialDate: '2026-09-09',
          status: { detailedState: 'Scheduled' },
          teams: {
            away: { team: { id: 142, name: 'Minnesota Twins' }, leagueRecord: { wins: 68, losses: 76 } },
            home: { team: { id: 116, name: 'Detroit Tigers' }, leagueRecord: { wins: 66, losses: 78 } },
          },
          venue: { id: 2394, name: 'Comerica Park' },
          gamesInSeries: 3,
          seriesGameNumber: 3,
          seriesDescription: 'Regular Season',
          scheduledInnings: 9,
        }],
      }],
    }}/>)

    const preview = screen.getByRole('region', { name: 'MLB Stats' })
    expect(preview).toHaveAttribute('data-preview-layout', 'baseball-schedule')
    const game = preview.querySelector('[data-game-pk="824226"]')
    expect(game).toHaveAttribute('data-game-status', 'Scheduled')
    expect(game).not.toHaveAttribute('data-away-score')
    expect(game).not.toHaveAttribute('data-home-score')
    expect(preview).toHaveTextContent('Minnesota Twins')
    expect(preview).toHaveTextContent('Detroit Tigers')
    expect(preview).toHaveTextContent('Away record · W–L68–76')
    expect(preview).toHaveTextContent('Home record · W–L66–78')
    expect(preview).toHaveTextContent('does not invent a 0–0 score')
    expect(preview).not.toHaveTextContent('MLB Stats record 1')
  })

  it('preserves completed MLB schedule scores when the provider supplies them', () => {
    render(<ResponseDemoPreview api={mlb} data={{
      totalGames: 1,
      dates: [{ date: '2025-04-15', games: [{
        gamePk: 777001,
        gameDate: '2025-04-15T23:10:00Z',
        status: { detailedState: 'Final' },
        teams: {
          away: { score: 4, team: { id: 1, name: 'Away Club' }, leagueRecord: { wins: 10, losses: 8 } },
          home: { score: 2, team: { id: 2, name: 'Home Club' }, leagueRecord: { wins: 9, losses: 9 } },
        },
        venue: { name: 'Ballpark' },
        seriesDescription: 'Regular Season',
      }] }],
    }}/>)
    const game = screen.getByRole('region', { name: 'MLB Stats' }).querySelector('[data-game-pk="777001"]')
    expect(game).toHaveAttribute('data-away-score', '4')
    expect(game).toHaveAttribute('data-home-score', '2')
    expect(screen.getByRole('region', { name: 'MLB Stats' })).toHaveTextContent('Final')
  })
})
