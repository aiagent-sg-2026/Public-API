import assert from 'node:assert/strict'
import fs from 'node:fs'
import { browser, evidence, root } from './lib/pages-origin-browser.mjs'

const report = { origin: 'https://yapweijun1996.github.io', publication: 'unpublished local app bundle under the real GitHub Pages origin', source: 'live ipify and Cat Facts endpoints from the Pages origin', checks: [], errors: [] }
const unnamed = (nodes) => nodes.filter((node) => !node.ignored && ['button','combobox','textbox','spinbutton','searchbox','tab','radio','link'].includes(node.role?.value) && !(node.name?.value || '').trim())
let b
try {
  b = await browser(`${root}/dist`)

  await b.nav('ipify-public-ip')
  const ipify = await b.run()
  assert.equal(ipify.ok, true, ipify.error)
  assert.equal(typeof ipify.data?.ip, 'string')
  const ipDom = await b.ev(`(() => { const shell=document.querySelector('.demo-preview'), card=shell.querySelector('.ipify-public-ip-preview'); const facts=Object.fromEntries([...card.querySelectorAll('.domain-facts > div')].map(row=>[row.querySelector('dt')?.textContent||'',row.querySelector('dd')?.textContent||''])); return {layout:shell.dataset.previewLayout,fallback:shell.dataset.ssotFallback,domain:card.dataset.domainCard,ip:card.dataset.publicIp,family:card.dataset.ipFamily,facts,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1} })()`)
  assert.equal(ipDom.layout, 'public-ip'); assert.equal(ipDom.fallback, 'false'); assert.equal(ipDom.domain, 'public-ip')
  assert.equal(ipDom.ip, ipify.data.ip); assert.equal(ipDom.facts['Public IP address'], ipify.data.ip)
  assert.equal(ipDom.family, ipify.data.ip.includes(':') ? 'IPv6' : 'IPv4'); assert.equal(ipDom.overflow, false)
  await b.viewport(390, 844)
  let mobile = await b.ev(`({documentOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,previewOverflow:document.querySelector('.demo-preview').scrollWidth>document.querySelector('.demo-preview').clientWidth+1})`)
  assert.equal(mobile.documentOverflow || mobile.previewOverflow, false, JSON.stringify(mobile))
  let ax = await b.call('Accessibility.getFullAXTree'); assert.equal(unnamed(ax.nodes).length, 0)
  report.checks.push({ id: 'ipify-public-ip', layout: 'public-ip', rawToDomIp: true, mobileOverflow: false, unnamedControls: 0 })

  await b.viewport(1280, 900)
  await b.nav('catfacts')
  const cat = await b.run()
  assert.equal(cat.ok, true, cat.error)
  assert.equal(typeof cat.data?.fact, 'string'); assert.equal(typeof cat.data?.length, 'number')
  const catDom = await b.ev(`(() => { const shell=document.querySelector('.demo-preview'), card=shell.querySelector('.cat-fact-preview'); const facts=Object.fromEntries([...card.querySelectorAll('.domain-facts > div')].map(row=>[row.querySelector('dt')?.textContent||'',row.querySelector('dd')?.textContent||''])); return {layout:shell.dataset.previewLayout,fallback:shell.dataset.ssotFallback,domain:card.dataset.domainCard,length:Number(card.dataset.factLength),quote:card.querySelector('blockquote p')?.textContent||'',facts,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1} })()`)
  assert.equal(catDom.layout, 'cat-fact'); assert.equal(catDom.fallback, 'false'); assert.equal(catDom.domain, 'cat-fact')
  assert.equal(catDom.quote, cat.data.fact); assert.equal(catDom.length, cat.data.length)
  assert.equal(catDom.facts['Provider-reported length'], `${cat.data.length} characters`); assert.equal(catDom.overflow, false)
  await b.viewport(390, 844)
  mobile = await b.ev(`({documentOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,previewOverflow:document.querySelector('.demo-preview').scrollWidth>document.querySelector('.demo-preview').clientWidth+1})`)
  assert.equal(mobile.documentOverflow || mobile.previewOverflow, false, JSON.stringify(mobile))
  ax = await b.call('Accessibility.getFullAXTree'); assert.equal(unnamed(ax.nodes).length, 0)
  report.checks.push({ id: 'catfacts', layout: 'cat-fact', rawToDomFact: true, rawToDomLength: true, mobileOverflow: false, unnamedControls: 0 })

  report.errors.push(...b.errors.map(String)); assert.deepEqual(report.errors, []); report.verdict = 'PASS'
} catch (error) { report.verdict = 'FAIL'; report.error = String(error); if (b) report.errors.push(...b.errors.map(String)) }
finally { if (b) await b.close() }
fs.writeFileSync(`${evidence}/terminal-semantic-cards.json`, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({ ...report, evidence: `${evidence}/terminal-semantic-cards.json` }, null, 2))
process.exit(report.verdict === 'PASS' ? 0 : 1)
