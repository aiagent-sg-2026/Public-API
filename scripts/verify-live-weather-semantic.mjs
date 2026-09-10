import assert from 'node:assert/strict'
import fs from 'node:fs'
import { browser, evidence, root } from './lib/pages-origin-browser.mjs'

const report = {
  origin: 'https://yapweijun1996.github.io',
  publication: 'unpublished local app bundle under the real GitHub Pages origin',
  scope: 'Open-Meteo Live Weather raw-response-to-semantic-DOM identity plus synthetic HTTP-200 malformed-body fail-closed regression',
  checks: [],
  errors: [],
}
const unnamed = (nodes) => nodes.filter((node) => !node.ignored && ['button', 'combobox', 'textbox', 'spinbutton', 'searchbox', 'tab', 'radio', 'link'].includes(node.role?.value) && !(node.name?.value || '').trim())
const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=1.3521&longitude=103.8198&current=temperature_2m%2Crelative_humidity_2m%2Cwind_speed_10m%2Cweather_code&timezone=auto'

let live
let malformed
try {
  live = await browser(`${root}/dist`)
  await live.nav('weather')
  const result = await live.run()
  assert.equal(result.ok, true, result.error)
  assert(result.data?.current && typeof result.data.current === 'object', 'Live provider response must include current')
  const current = result.data.current
  const dom = await live.ev(`(()=>{const c=document.querySelector('[data-domain-card="current-weather"]');return {
    state:c?.dataset.resultState||'',
    time:c?.dataset.observationTime||'',
    temperature:Number(c?.getAttribute('data-temperature-2m')),
    humidity:Number(c?.getAttribute('data-relative-humidity-2m')),
    wind:Number(c?.getAttribute('data-wind-speed-10m')),
    code:Number(c?.getAttribute('data-weather-code')),
    text:c?.innerText||'',
    overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
    transport:document.querySelector('.demo-preview [role="status"]')?.textContent||'',
  }})()`)
  assert.equal(dom.state, 'ready')
  assert.equal(dom.time, String(current.time))
  assert.equal(dom.temperature, Number(current.temperature_2m))
  assert.equal(dom.humidity, Number(current.relative_humidity_2m))
  assert.equal(dom.wind, Number(current.wind_speed_10m))
  assert.equal(dom.code, Number(current.weather_code))
  assert.equal(dom.overflow, false)
  assert.match(dom.transport, /Live response received/)
  await live.viewport(390, 844)
  assert.equal(await live.ev(`document.documentElement.scrollWidth>document.documentElement.clientWidth+1`), false)
  const liveAx = await live.call('Accessibility.getFullAXTree')
  assert.equal(unnamed(liveAx.nodes).length, 0)
  assert.deepEqual(live.errors, [])
  report.checks.push({
    id: 'weather',
    case: 'live current conditions',
    source: 'live Open-Meteo provider',
    semanticState: dom.state,
    rawToDomIdentity: 'time, temperature, humidity, wind speed, weather code exact',
    mobileOverflow: false,
    unnamedControls: 0,
  })

  if (live) { await live.close(); live = undefined }

  malformed = await browser(`${root}/dist`, { fixtures: new Map([[weatherUrl, { body: {} }]]) })
  await malformed.nav('weather')
  const malformedResult = await malformed.run()
  assert.equal(malformedResult.ok, true, malformedResult.error)
  const malformedDom = await malformed.ev(`(()=>{const c=document.querySelector('[data-domain-card="current-weather"]');return {
    state:c?.dataset.resultState||'',
    text:c?.innerText||'',
    fakeLive:[...document.querySelectorAll('.demo-preview *')].some(e=>['Live reading','Live station'].includes((e.textContent||'').trim())),
    http:document.querySelector('.ssot-runtime b')?.textContent||'',
  }})()`)
  assert.equal(malformedDom.state, 'invalid')
  assert.match(malformedDom.text, /No live weather conclusion can be drawn/)
  assert.equal(malformedDom.fakeLive, false)
  assert.match(malformedDom.http, /^200/)
  assert.equal(malformed.fixtureRequests.filter((request) => request.url === weatherUrl && request.method === 'GET').length, 1)
  assert.deepEqual(malformed.errors, [])
  report.checks.push({
    id: 'weather',
    case: 'synthetic malformed HTTP-200 JSON body',
    transportStatus: 200,
    semanticState: malformedDom.state,
    fabricatedLivePlaceholder: false,
    exactProviderFixtureRequests: 1,
  })

  report.verdict = 'PASS'
} catch (error) {
  report.verdict = 'FAIL'
  report.error = String(error)
  if (live) report.errors.push(...live.errors.map(String))
  if (malformed) report.errors.push(...malformed.errors.map(String))
} finally {
  if (live) await live.close()
  if (malformed) await malformed.close()
}

fs.writeFileSync(`${evidence}/live-weather-semantic-verification.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ ...report, evidence: `${evidence}/live-weather-semantic-verification.json` }, null, 2))
process.exit(report.verdict === 'PASS' ? 0 : 1)
