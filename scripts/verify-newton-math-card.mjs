import assert from 'node:assert/strict'
import fs from 'node:fs'
import { browser, evidence, root } from './lib/pages-origin-browser.mjs'

const report = {
  origin: 'https://yapweijun1996.github.io',
  publication: 'unpublished local app bundle under the real GitHub Pages origin',
  source: 'live Newton API V2 from the Pages origin',
  checks: [],
  errors: [],
}
const unnamed = (nodes) => nodes.filter((node) => !node.ignored && ['button','combobox','textbox','spinbutton','searchbox','tab','radio','link'].includes(node.role?.value) && !(node.name?.value || '').trim())
let b
try {
  b = await browser(`${root}/dist`)
  await b.nav('newton-math-solver')
  const result = await b.run()
  assert.equal(result.ok, true, result.error)
  assert.equal(typeof result.data, 'object')
  assert.equal(result.data?.operation, 'simplify')
  assert.equal(result.data?.expression, '2x+2x')
  assert.equal(typeof result.data?.result, 'string')

  const dom = await b.ev(`(() => {
    const shell=document.querySelector('.demo-preview'), card=shell.querySelector('.newton-math-preview'), url=new URL(document.querySelector('.endpoint-box code').textContent)
    const facts=Object.fromEntries([...card.querySelectorAll('.domain-facts > div')].map(row=>[row.querySelector('dt')?.textContent||'',row.querySelector('dd')?.textContent||'']))
    return {layout:shell.dataset.previewLayout,fallback:shell.dataset.ssotFallback,domain:card.dataset.domainCard,operation:card.dataset.operation,expression:card.dataset.expression,result:card.dataset.result,facts,hostname:url.hostname,pathname:url.pathname,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,note:card.querySelector('.domain-note')?.textContent||''}
  })()`)
  assert.equal(dom.layout, 'symbolic-math'); assert.equal(dom.fallback, 'false'); assert.equal(dom.domain, 'symbolic-math')
  assert.equal(dom.operation, result.data.operation); assert.equal(dom.expression, result.data.expression); assert.equal(dom.result, result.data.result)
  assert.equal(dom.facts.Operation, 'Simplify'); assert.equal(dom.facts['Input expression'], result.data.expression); assert.equal(dom.facts.Result, result.data.result)
  assert.equal(dom.hostname, 'newton.vercel.app'); assert.equal(dom.pathname, '/api/v2/simplify/2x%2B2x')
  assert.match(dom.note, /community-maintained/); assert.equal(dom.overflow, false)

  await b.viewport(390, 844)
  const mobile = await b.ev(`({documentOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,previewOverflow:document.querySelector('.demo-preview').scrollWidth>document.querySelector('.demo-preview').clientWidth+1})`)
  assert.equal(mobile.documentOverflow || mobile.previewOverflow, false, JSON.stringify(mobile))
  const ax = await b.call('Accessibility.getFullAXTree'); assert.equal(unnamed(ax.nodes).length, 0)

  report.checks.push({id:'newton-math-solver',contract:'direct Vercel V2 symbolic operation path',operation:'exact response match',expression:'exact response match',result:'exact response match',mobileOverflow:false,unnamedControls:0})
  report.errors.push(...b.errors.map(String)); assert.deepEqual(report.errors, []); report.verdict='PASS'
} catch (error) { report.verdict='FAIL'; report.error=String(error); if (b) report.errors.push(...b.errors.map(String)) }
finally { if (b) await b.close() }
fs.writeFileSync(`${evidence}/newton-math-card.json`, `${JSON.stringify(report,null,2)}\n`)
console.log(JSON.stringify({...report,evidence:`${evidence}/newton-math-card.json`},null,2))
process.exit(report.verdict==='PASS'?0:1)
