import assert from 'node:assert/strict'
import fs from 'node:fs'
import { browser, evidence, root, sleep } from './lib/pages-origin-browser.mjs'

const report = {
  origin: 'https://yapweijun1996.github.io',
  publication: 'unpublished local app bundle under the real GitHub Pages origin',
  source: 'live Government of Canada Open Government CKAN API from the Pages origin',
  checks: [], errors: [],
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
const unique = (values) => [...new Set(values.filter((value) => typeof value === 'string' && value.trim()))]

let b
try {
  b = await browser(`${root}/dist`)
  await b.nav('canada-open-data-search')
  await setControl(b, 'query', 'climate')
  await setControl(b, 'limit', '3')
  const result = await b.run()
  assert.equal(result.ok, true, result.error)
  assert.equal(result.data?.success, true, 'CKAN response did not report success')
  const records = result.data?.result?.results || []
  assert.equal(records.length, 3, `Expected exactly 3 provider records, got ${records.length}`)
  assert(Number(result.data?.result?.count) >= records.length, 'Provider total count is missing or inconsistent')
  const first = records[0] || {}
  assert(first.id, 'First Canada catalogue record has no stable ID')
  assert(first.type || first.collection, 'First Canada catalogue record has no provider type/collection identity')
  assert(first.license_title, 'First Canada catalogue record has no licence metadata')
  const resources = Array.isArray(first.resources) ? first.resources : []
  const formats = unique(resources.map((resource) => resource?.format))
  const languages = unique(resources.flatMap((resource) => Array.isArray(resource?.language) ? resource.language : []))
  const resourceTypes = unique(resources.map((resource) => resource?.resource_type))
  const expectedTitle = first.title_translated?.en || first.title
  const expectedFrenchTitle = first.title_translated?.fr
  const expectedPublisher = first.organization?.title || first.org_title_at_publication?.en || 'Publisher not supplied'

  const dom = await b.ev(`(() => {
    const shell = document.querySelector('.demo-preview')
    const card = shell.querySelector('.canada-open-data-preview')
    const firstRecord = card.querySelector('[data-record-index="1"]')
    const facts = Object.fromEntries([...firstRecord.querySelectorAll('.domain-facts > div')].map((item) => [item.querySelector('dt')?.textContent || '', item.querySelector('dd')?.textContent || '']))
    return {
      layout: shell.dataset.previewLayout,
      fallback: shell.dataset.ssotFallback,
      domain: card.dataset.domainCard,
      rowCount: Number(card.dataset.rowCount),
      visibleCount: Number(card.dataset.visibleCount),
      totalResults: Number(card.dataset.totalResults),
      primaryRecordId: card.dataset.primaryRecordId,
      recordId: firstRecord.dataset.recordId,
      recordType: firstRecord.dataset.recordType,
      collection: firstRecord.dataset.collection,
      license: firstRecord.dataset.license,
      restrictions: firstRecord.dataset.restrictions,
      resourceCount: Number(firstRecord.dataset.resourceCount),
      heading: firstRecord.querySelector('h4')?.innerText || '',
      frenchTitle: firstRecord.querySelector('p[lang="fr"]')?.innerText || '',
      facts,
      generic: (shell.innerText || '').includes('Canada Open Data Search record 1'),
    }
  })()`)

  assert.equal(dom.layout, 'open-data-catalog')
  assert.equal(dom.fallback, 'false')
  assert.equal(dom.domain, 'open-data-catalog')
  assert.equal(dom.rowCount, records.length)
  assert.equal(dom.visibleCount, records.length)
  assert.equal(dom.totalResults, Number(result.data.result.count))
  assert.equal(dom.primaryRecordId, String(first.id))
  assert.equal(dom.recordId, String(first.id))
  assert.equal(dom.recordType, String(first.type || 'Not supplied'))
  assert.equal(dom.collection, String(first.collection || 'Not supplied'))
  assert.equal(dom.license, String(first.license_title))
  assert.equal(dom.restrictions, String(first.restrictions || 'Not supplied'))
  assert.equal(dom.resourceCount, resources.length)
  assert.equal(dom.heading, String(expectedTitle))
  if (expectedFrenchTitle && expectedFrenchTitle !== expectedTitle) assert.equal(dom.frenchTitle, String(expectedFrenchTitle))
  assert.equal(dom.facts.Publisher, String(expectedPublisher))
  assert.equal(dom.facts['Provider type'], String(first.type || 'Not supplied'))
  assert.equal(dom.facts.Collection, String(first.collection || 'Not supplied'))
  assert.equal(dom.facts.Resources, resources.length.toLocaleString('en'))
  assert.equal(dom.facts.Formats, formats.length ? formats.join(' · ') : 'Not supplied')
  assert.equal(dom.facts.Languages, languages.length ? languages.join(' · ') : 'Not supplied')
  assert.equal(dom.facts['Resource types'], resourceTypes.length ? resourceTypes.join(' · ') : 'Not supplied')
  assert.equal(dom.generic, false)

  await b.viewport(390, 844)
  const overflow = await b.ev(`({
    documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    previewOverflow: document.querySelector('.demo-preview').scrollWidth > document.querySelector('.demo-preview').clientWidth + 1,
  })`)
  assert.equal(overflow.documentOverflow || overflow.previewOverflow, false, JSON.stringify(overflow))
  const ax = await b.call('Accessibility.getFullAXTree')
  assert.equal(unnamed(ax.nodes).length, 0)

  report.checks.push({ id: 'canada-open-data-search', query: 'climate', requestedRows: 3, returnedRecords: records.length, totalMatches: result.data.result.count, primaryRecordId: first.id, providerType: first.type, collection: first.collection, license: first.license_title, resourceFormats: formats, languages, rawToSemanticDom: 'exact match', mobileOverflow: false, unnamedControls: 0 })
  report.errors.push(...b.errors.map(String))
  assert.deepEqual(report.errors, [])
  report.verdict = 'PASS'
} catch (error) {
  report.verdict = 'FAIL'; report.error = String(error)
  if (b) report.errors.push(...b.errors.map(String))
} finally { if (b) await b.close() }

fs.writeFileSync(`${evidence}/canada-open-data-card.json`, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({ ...report, evidence: `${evidence}/canada-open-data-card.json` }, null, 2))
process.exit(report.verdict === 'PASS' ? 0 : 1)
