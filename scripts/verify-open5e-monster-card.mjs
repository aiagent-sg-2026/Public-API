import assert from 'node:assert/strict'
import fs from 'node:fs'
import { browser, evidence, root } from './lib/pages-origin-browser.mjs'

const report = { origin: 'https://yapweijun1996.github.io', publication: 'unpublished local app bundle under the real GitHub Pages origin', source: 'live Open5e V2 creatures API from the Pages origin', checks: [], errors: [] }
const unnamed = (nodes) => nodes.filter((node) => !node.ignored && ['button','combobox','textbox','spinbutton','searchbox','tab','radio','link'].includes(node.role?.value) && !(node.name?.value || '').trim())
let b
try {
  b = await browser(`${root}/dist`)
  await b.nav('open5e-monster-search')
  const result = await b.run()
  assert.equal(result.ok, true, result.error)
  assert(Array.isArray(result.data?.results) && result.data.results.length > 0, 'Open5e V2 returned no creature records')
  const first = result.data.results[0]
  const dom = await b.ev(`(() => {
    const shell=document.querySelector('.demo-preview'), card=shell.querySelector('.open5e-monster-preview'), first=shell.querySelector('.semantic-card-grid article'), url=new URL(document.querySelector('.endpoint-box code').textContent)
    const metrics=Object.fromEntries([...first.querySelectorAll('dl > div')].map(row=>[row.querySelector('dt')?.textContent||'',row.querySelector('dd')?.textContent||'']))
    return {layout:shell.dataset.previewLayout,fallback:shell.dataset.ssotFallback,version:card.dataset.apiVersion,total:Number(card.dataset.providerTotal),visible:Number(card.dataset.visibleCount),key:card.dataset.primaryMonsterKey,name:card.dataset.primaryMonsterName,source:card.dataset.primarySource,system:card.dataset.primaryGameSystem,heading:first.querySelector('h3')?.textContent||'',badge:first.querySelector('header em')?.textContent||'',metrics,pathname:url.pathname,query:url.searchParams.get('name__icontains'),limit:url.searchParams.get('limit'),fields:url.searchParams.get('fields'),documentFields:url.searchParams.get('document__fields'),generic:(shell.innerText||'').includes('Open5e Monster Search record 1'),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1}
  })()`)
  const source = first.document || {}, gameSystem = source.gamesystem || {}, type = first.type || {}, size = first.size || {}
  assert.equal(dom.layout, 'monster-statblock'); assert.equal(dom.fallback, 'false'); assert.equal(dom.version, 'v2')
  assert.equal(dom.total, Number(result.data.count)); assert.equal(dom.visible, Math.min(result.data.results.length, 8))
  assert.equal(dom.key, String(first.key || '')); assert.equal(dom.name, String(first.name || '')); assert.equal(dom.source, String(source.name || '')); assert.equal(dom.system, String(gameSystem.name || ''))
  assert.equal(dom.heading, String(first.name || '')); assert.equal(dom.badge, `CR ${first.challenge_rating ?? 'Not supplied'}`)
  assert.equal(dom.metrics['Armor class'], String(first.armor_class ?? 'Not supplied')); assert.equal(dom.metrics['Hit points'], String(first.hit_points ?? 'Not supplied')); assert.equal(dom.metrics.Source, String(source.name || 'Not supplied')); assert.equal(dom.metrics['Game system'], String(gameSystem.name || 'Not supplied'))
  assert.equal(dom.pathname, '/v2/creatures/'); assert.equal(dom.query, 'dragon'); assert.equal(dom.limit, '8'); assert(dom.fields.includes('challenge_rating') && dom.fields.includes('passive_perception')); assert.equal(dom.documentFields, 'name,key,gamesystem')
  assert.equal(dom.generic || dom.overflow, false); assert(type.name && size.name, 'V2 projected creature type/size missing')
  await b.viewport(390, 844)
  const mobile = await b.ev(`({documentOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,previewOverflow:document.querySelector('.demo-preview').scrollWidth>document.querySelector('.demo-preview').clientWidth+1})`)
  assert.equal(mobile.documentOverflow || mobile.previewOverflow, false, JSON.stringify(mobile))
  const ax = await b.call('Accessibility.getFullAXTree'); assert.equal(unnamed(ax.nodes).length, 0)
  report.checks.push({id:'open5e-monster-search',apiVersion:'v2',providerTotal:result.data.count,returned:result.data.results.length,primaryIdentity:'exact response match',sourceAndGameSystem:'exact response match',combatFacts:'exact response match',mobileOverflow:false,unnamedControls:0})
  report.errors.push(...b.errors.map(String)); assert.deepEqual(report.errors, []); report.verdict='PASS'
} catch (error) { report.verdict='FAIL'; report.error=String(error); if (b) report.errors.push(...b.errors.map(String)) }
finally { if (b) await b.close() }
fs.writeFileSync(`${evidence}/open5e-monster-card.json`, `${JSON.stringify(report,null,2)}\n`)
console.log(JSON.stringify({...report,evidence:`${evidence}/open5e-monster-card.json`},null,2))
process.exit(report.verdict==='PASS'?0:1)
