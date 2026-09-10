import assert from 'node:assert/strict'
import fs from 'node:fs'
import { browser, evidence, root, sleep } from './lib/pages-origin-browser.mjs'

const report = { origin: 'https://yapweijun1996.github.io', publication: 'unpublished local app bundle under the real GitHub Pages origin', source: 'live Iconify and Homebrew APIs from the Pages origin', checks: [], errors: [] }
const unnamed = (nodes) => nodes.filter((node) => !node.ignored && ['button', 'combobox', 'textbox', 'spinbutton', 'searchbox', 'tab', 'radio', 'link'].includes(node.role?.value) && !(node.name?.value || '').trim())
const setControl = async (b, name, value) => {
  await b.ev(`(() => { const element = document.querySelector('[name=${JSON.stringify(name)}]'); if (!element) throw new Error('Missing control'); const prototype = element.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, ${JSON.stringify(value)}); element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); })()`)
  await sleep(80)
}
const mobileAx = async (b) => {
  await b.viewport(390, 844)
  const overflow = await b.ev(`({ documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, previewOverflow: document.querySelector('.demo-preview').scrollWidth > document.querySelector('.demo-preview').clientWidth + 1 })`)
  assert.equal(overflow.documentOverflow || overflow.previewOverflow, false, JSON.stringify(overflow))
  const ax = await b.call('Accessibility.getFullAXTree')
  assert.equal(unnamed(ax.nodes).length, 0)
}
const macosRequirement = (data) => {
  const entries = Object.entries(data?.depends_on?.macos || {})
  if (!entries.length) return 'Not supplied'
  const [operator, raw] = entries[0]
  const values = Array.isArray(raw) ? raw.filter((value) => typeof value === 'string') : []
  return values.length ? `${operator} ${values.join(', ')}` : String(raw ?? 'Not supplied')
}

let b
try {
  b = await browser(`${root}/dist`)

  await b.nav('iconify-search')
  await setControl(b, 'query', 'home')
  await setControl(b, 'limit', '32')
  let result = await b.run()
  assert.equal(result.ok, true, result.error)
  const icon = result.data?.icons?.[0]
  assert(icon, 'Iconify returned no icon IDs')
  assert.equal(result.data?.request?.query, 'home')
  assert.equal(result.data?.request?.limit, '32')
  const prefix = String(icon).split(':', 1)[0]
  const collection = result.data?.collections?.[prefix] || {}
  const iconDom = await b.ev(`(() => { const shell=document.querySelector('.demo-preview'), card=shell.querySelector('.iconify-search-preview'), first=card.querySelector('[data-record-index="1"]'); const facts=Object.fromEntries([...card.querySelectorAll(':scope > .domain-facts > div')].map(row=>[row.querySelector('dt')?.textContent||'',row.querySelector('dd')?.textContent||''])); return { layout:shell.dataset.previewLayout, fallback:shell.dataset.ssotFallback, primary:card.dataset.primaryIconId, query:card.dataset.query, limit:Number(card.dataset.providerLimit), limitReached:card.dataset.limitReached, id:first.dataset.iconId, prefix:first.dataset.iconPrefix, author:first.dataset.author, spdx:first.dataset.licenseSpdx, heading:first.querySelector('h3')?.textContent||'', facts, generic:(shell.innerText||'').includes('Iconify Search record 1') }; })()`)
  assert.equal(iconDom.layout, 'icon-catalog')
  assert.equal(iconDom.fallback, 'false')
  assert.equal(iconDom.primary, String(icon))
  assert.equal(iconDom.id, String(icon))
  assert.equal(iconDom.prefix, prefix)
  assert.equal(iconDom.author, String(collection.author?.name || ''))
  assert.equal(iconDom.spdx, String(collection.license?.spdx || ''))
  assert.equal(iconDom.query, 'home')
  assert.equal(iconDom.limit, 32)
  assert.equal(iconDom.limitReached, String(result.data.icons.length >= result.data.limit))
  assert.equal(iconDom.heading, String(icon))
  assert.equal(iconDom.generic, false)
  await mobileAx(b)
  report.checks.push({ id:'iconify-search', returned:result.data.icons.length, limit:result.data.limit, primaryIcon:icon, collection:collection.name, author:collection.author?.name, license:collection.license?.spdx || collection.license?.title, rawToSemanticDom:'exact match', mobileOverflow:false, unnamedControls:0 })

  await b.nav('homebrew-formula-json')
  await setControl(b, 'formula', 'node')
  await setControl(b, 'collection', 'formula')
  result = await b.run()
  assert.equal(result.ok, true, result.error)
  const formula = result.data
  const bottleCount = Object.keys(formula?.bottle?.stable?.files || {}).length
  const formulaDom = await b.ev(`(() => { const shell=document.querySelector('.demo-preview'), card=shell.querySelector('.homebrew-package-preview'); const facts=Object.fromEntries([...card.querySelectorAll(':scope > .domain-facts > div')].map(row=>[row.querySelector('dt')?.textContent||'',row.querySelector('dd')?.textContent||''])); return { layout:shell.dataset.previewLayout, kind:card.dataset.packageKind, name:card.dataset.packageName, version:card.dataset.version, license:card.dataset.license, deps:Number(card.dataset.dependencyCount), bottles:Number(card.dataset.bottlePlatformCount), heading:card.querySelector('.domain-heading h3')?.textContent||'', facts, text:card.innerText||'', generic:(shell.innerText||'').includes('Homebrew Formula JSON record 1') }; })()`)
  assert.equal(formulaDom.layout, 'homebrew-package')
  assert.equal(formulaDom.kind, 'formula')
  assert.equal(formulaDom.name, String(formula.full_name || formula.name))
  assert.equal(formulaDom.version, String(formula.versions?.stable || 'Not supplied'))
  assert.equal(formulaDom.license, String(formula.license || ''))
  assert.equal(formulaDom.deps, (formula.dependencies || []).length)
  assert.equal(formulaDom.bottles, bottleCount)
  assert.equal(formulaDom.heading, String(formula.full_name || formula.name))
  assert(formulaDom.text.includes('Runtime dependencies'))
  assert.equal(formulaDom.generic, false)
  await mobileAx(b)
  report.checks.push({ id:'homebrew-formula-json', collection:'formula', token:'node', version:formula.versions?.stable, license:formula.license, dependencies:(formula.dependencies||[]).length, bottlePlatforms:bottleCount, rawToSemanticDom:'exact match', mobileOverflow:false, unnamedControls:0 })

  await b.nav('homebrew-formula-json')
  await setControl(b, 'formula', 'postman')
  await setControl(b, 'collection', 'cask')
  result = await b.run()
  assert.equal(result.ok, true, result.error)
  const cask = result.data
  const caskDom = await b.ev(`(() => { const shell=document.querySelector('.demo-preview'), card=shell.querySelector('.homebrew-package-preview'); return { layout:shell.dataset.previewLayout, kind:card.dataset.packageKind, token:card.dataset.packageToken, name:card.dataset.packageName, version:card.dataset.version, auto:card.dataset.autoUpdates, macos:card.dataset.macosRequirement, artifacts:Number(card.dataset.artifactCount), heading:card.querySelector('.domain-heading h3')?.textContent||'', text:card.innerText||'', generic:(shell.innerText||'').includes('Homebrew Formula JSON record 1') }; })()`)
  assert.equal(caskDom.layout, 'homebrew-package')
  assert.equal(caskDom.kind, 'cask')
  assert.equal(caskDom.token, String(cask.token))
  assert.equal(caskDom.name, String(cask.name?.[0] || cask.token))
  assert.equal(caskDom.version, String(cask.version))
  assert.equal(caskDom.auto, String(cask.auto_updates === true))
  assert.equal(caskDom.macos, macosRequirement(cask))
  assert.equal(caskDom.artifacts, (cask.artifacts || []).length)
  assert.equal(caskDom.heading, String(cask.name?.[0] || cask.token))
  assert(caskDom.text.includes('Postman.app'))
  assert.equal(caskDom.generic, false)
  await mobileAx(b)
  report.checks.push({ id:'homebrew-formula-json', collection:'cask', token:cask.token, version:cask.version, autoUpdates:cask.auto_updates, macosRequirement:macosRequirement(cask), artifacts:(cask.artifacts||[]).length, rawToSemanticDom:'exact match', mobileOverflow:false, unnamedControls:0 })

  report.errors.push(...b.errors.map(String))
  assert.deepEqual(report.errors, [])
  report.verdict = 'PASS'
} catch (error) {
  report.verdict = 'FAIL'; report.error = String(error)
  if (b) report.errors.push(...b.errors.map(String))
} finally { if (b) await b.close() }
fs.writeFileSync(`${evidence}/package-icon-cards.json`, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({ ...report, evidence: `${evidence}/package-icon-cards.json` }, null, 2))
process.exit(report.verdict === 'PASS' ? 0 : 1)
