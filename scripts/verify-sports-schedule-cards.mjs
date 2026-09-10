import assert from 'node:assert/strict'
import fs from 'node:fs'
import { browser, evidence, root, sleep } from './lib/pages-origin-browser.mjs'

const report = {
  origin: 'https://yapweijun1996.github.io',
  publication: 'unpublished local app bundle under the real GitHub Pages origin',
  source: 'live providers from the Pages origin',
  checks: [],
  errors: [],
}

const unnamed = (nodes) => nodes.filter((node) => !node.ignored && ['button', 'combobox', 'textbox', 'spinbutton', 'searchbox', 'tab', 'radio', 'link'].includes(node.role?.value) && !(node.name?.value || '').trim())
const setControl = async (b, name, value) => {
  await b.ev(`(() => {
    const element = document.querySelector('[name=${JSON.stringify(name)}]')
    if (!element) throw new Error('Missing control ' + ${JSON.stringify(name)})
    const prototype = element.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, ${JSON.stringify(value)})
    element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }))
  })()`)
  await sleep(80)
}
const verifyMobileAx = async (b) => {
  await b.viewport(390, 844)
  const state = await b.ev(`({
    documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    previewOverflow: document.querySelector('.demo-preview').scrollWidth > document.querySelector('.demo-preview').clientWidth + 1,
  })`)
  assert.equal(state.documentOverflow || state.previewOverflow, false, JSON.stringify(state))
  const ax = await b.call('Accessibility.getFullAXTree')
  assert.equal(unnamed(ax.nodes).length, 0)
}
const finalKinds = ['AfterPenalties', 'AfterExtraTime', 'After90Minutes']
const selectOpenLigaResult = (results = []) => [...results].sort((a, b) => {
  const aIndex = finalKinds.indexOf(String(a.resultTypeKind || ''))
  const bIndex = finalKinds.indexOf(String(b.resultTypeKind || ''))
  const aPriority = aIndex < 0 ? 99 : aIndex
  const bPriority = bIndex < 0 ? 99 : bIndex
  return aPriority === bPriority ? Number(b.resultOrderID || -1) - Number(a.resultOrderID || -1) : aPriority - bPriority
})[0] || {}

let b
try {
  b = await browser(`${root}/dist`)

  await b.nav('openligadb-matches')
  await setControl(b, 'league', 'bl1')
  await setControl(b, 'season', '2025')
  await setControl(b, 'matchday', '1')
  const openLiga = await b.run()
  assert.equal(openLiga.ok, true, openLiga.error)
  assert(Array.isArray(openLiga.data) && openLiga.data.length > 0, 'OpenLigaDB returned no matchday records')
  const match = openLiga.data[0]
  const expectedResult = selectOpenLigaResult(match.matchResults)
  const openLigaDom = await b.ev(`(() => {
    const shell = document.querySelector('.demo-preview')
    const card = shell.querySelector('.openligadb-preview')
    const row = card.querySelector('[data-match-index="1"]')
    const facts = Object.fromEntries([...row.querySelectorAll('.domain-facts > div')].map((item) => [item.querySelector('dt')?.textContent || '', item.querySelector('dd')?.textContent || '']))
    return {
      layout: shell.dataset.previewLayout,
      fallback: shell.dataset.ssotFallback,
      domain: card.dataset.domainCard,
      matchId: Number(row.dataset.matchId),
      team1Id: Number(row.dataset.team1Id),
      team2Id: Number(row.dataset.team2Id),
      finished: row.dataset.matchFinished,
      kickoffUtc: row.dataset.kickoffUtc || '',
      resultKind: row.dataset.resultKind || '',
      team1Score: row.dataset.team1Score === undefined ? null : Number(row.dataset.team1Score),
      team2Score: row.dataset.team2Score === undefined ? null : Number(row.dataset.team2Score),
      heading: row.querySelector('h4')?.innerText || '',
      facts,
      generic: (shell.innerText || '').includes('OpenLigaDB record 1'),
    }
  })()`)
  assert.equal(openLigaDom.layout, 'football-matchday')
  assert.equal(openLigaDom.fallback, 'false')
  assert.equal(openLigaDom.domain, 'football-matchday')
  assert.equal(openLigaDom.matchId, Number(match.matchID))
  assert.equal(openLigaDom.team1Id, Number(match.team1?.teamId))
  assert.equal(openLigaDom.team2Id, Number(match.team2?.teamId))
  assert.equal(openLigaDom.finished, String(match.matchIsFinished))
  assert.equal(openLigaDom.kickoffUtc, String(match.matchDateTimeUTC || ''))
  assert.equal(openLigaDom.resultKind, String(expectedResult.resultTypeKind || ''))
  assert.equal(openLigaDom.team1Score, expectedResult.pointsTeam1 === undefined ? null : Number(expectedResult.pointsTeam1))
  assert.equal(openLigaDom.team2Score, expectedResult.pointsTeam2 === undefined ? null : Number(expectedResult.pointsTeam2))
  assert(openLigaDom.heading.includes(String(match.team1?.teamName || match.team1?.shortName || '')))
  assert(openLigaDom.heading.includes(String(match.team2?.teamName || match.team2?.shortName || '')))
  assert.equal(openLigaDom.facts['Result type'], String(expectedResult.resultTypeKind || 'Not supplied'))
  assert.equal(openLigaDom.facts['Goals returned'], String((match.goals || []).length))
  assert.equal(openLigaDom.generic, false)
  await verifyMobileAx(b)
  report.checks.push({ id: 'openligadb-matches', source: 'live provider', layout: openLigaDom.layout, matchIdentity: 'exact response match', typedResult: String(expectedResult.resultTypeKind || ''), score: 'exact selected typed result', mobileOverflow: false, unnamedControls: 0 })

  await b.nav('mlb-stats-api')
  const mlbInputType = await b.ev(`document.querySelector('input[name="date"]')?.type || ''`)
  assert.equal(mlbInputType, 'date')
  await setControl(b, 'date', '2025-04-15')
  await setControl(b, 'sportId', '1')
  const mlbEndpoint = new URL(await b.ev(`document.querySelector('.endpoint-box code')?.textContent || ''`))
  assert.equal(mlbEndpoint.searchParams.get('date'), '2025-04-15')
  assert.equal(mlbEndpoint.searchParams.has('teamId'), false)
  const mlb = await b.run()
  assert.equal(mlb.ok, true, mlb.error)
  const mlbGames = (mlb.data?.dates || []).flatMap((dateBlock) => dateBlock.games || [])
  assert(mlbGames.length > 0, 'MLB returned no games for 2025-04-15')
  const game = mlbGames[0]
  const mlbDom = await b.ev(`(() => {
    const shell = document.querySelector('.demo-preview')
    const card = shell.querySelector('.mlb-schedule-preview')
    const row = card.querySelector('[data-game-index="1"]')
    const facts = Object.fromEntries([...row.querySelectorAll('.domain-facts > div')].map((item) => [item.querySelector('dt')?.textContent || '', item.querySelector('dd')?.textContent || '']))
    return {
      layout: shell.dataset.previewLayout,
      fallback: shell.dataset.ssotFallback,
      domain: card.dataset.domainCard,
      scheduleDate: card.dataset.scheduleDate || '',
      gamePk: Number(row.dataset.gamePk),
      awayTeamId: Number(row.dataset.awayTeamId),
      homeTeamId: Number(row.dataset.homeTeamId),
      status: row.dataset.gameStatus || '',
      start: row.dataset.gameStart || '',
      awayScore: row.dataset.awayScore === undefined ? null : Number(row.dataset.awayScore),
      homeScore: row.dataset.homeScore === undefined ? null : Number(row.dataset.homeScore),
      heading: row.querySelector('h4')?.innerText || '',
      facts,
      generic: (shell.innerText || '').includes('MLB Stats record 1'),
    }
  })()`)
  assert.equal(mlbDom.layout, 'baseball-schedule')
  assert.equal(mlbDom.fallback, 'false')
  assert.equal(mlbDom.domain, 'baseball-schedule')
  assert.equal(mlbDom.scheduleDate, String((mlb.data?.dates || [])[0]?.date || game.officialDate || ''))
  assert.equal(mlbDom.gamePk, Number(game.gamePk))
  assert.equal(mlbDom.awayTeamId, Number(game.teams?.away?.team?.id))
  assert.equal(mlbDom.homeTeamId, Number(game.teams?.home?.team?.id))
  assert.equal(mlbDom.status, String(game.status?.detailedState || game.status?.abstractGameState || 'Status not supplied'))
  assert.equal(mlbDom.start, String(game.gameDate || ''))
  assert.equal(mlbDom.awayScore, game.teams?.away?.score === undefined ? null : Number(game.teams.away.score))
  assert.equal(mlbDom.homeScore, game.teams?.home?.score === undefined ? null : Number(game.teams.home.score))
  assert(mlbDom.heading.includes(String(game.teams?.away?.team?.name || '')))
  assert(mlbDom.heading.includes(String(game.teams?.home?.team?.name || '')))
  assert.equal(mlbDom.facts.Venue, String(game.venue?.name || 'Not supplied'))
  assert.equal(mlbDom.generic, false)
  await verifyMobileAx(b)
  report.checks.push({ id: 'mlb-stats-api', source: 'live provider', nativeDateInput: true, requestedDate: '2025-04-15', hiddenTeamIdAbsent: true, layout: mlbDom.layout, gameIdentity: 'exact response match', statusAndScores: 'exact response match', mobileOverflow: false, unnamedControls: 0 })

  report.errors.push(...b.errors.map(String))
  assert.deepEqual(report.errors, [])
  report.verdict = 'PASS'
} catch (error) {
  report.verdict = 'FAIL'
  report.error = String(error)
  if (b) report.errors.push(...b.errors.map(String))
} finally {
  if (b) await b.close()
}

fs.writeFileSync(`${evidence}/sports-schedule-cards.json`, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({ ...report, evidence: `${evidence}/sports-schedule-cards.json` }, null, 2))
process.exit(report.verdict === 'PASS' ? 0 : 1)
