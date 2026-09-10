import assert from 'node:assert/strict'
import fs from 'node:fs'
import { browser, evidence, root, sleep } from './lib/pages-origin-browser.mjs'

const report = {
  origin: 'https://yapweijun1996.github.io',
  publication: 'unpublished local app bundle under the real GitHub Pages origin',
  source: 'live UK Parliament Members API from the Pages origin',
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

let b
try {
  b = await browser(`${root}/dist`)
  await b.nav('uk-parliament-members')
  await setControl(b, 'query', 'a')
  await setControl(b, 'limit', '3')
  const result = await b.run()
  assert.equal(result.ok, true, result.error)
  assert(Array.isArray(result.data?.items), 'UK Parliament response did not expose items')
  assert(result.data.items.length > 0, 'UK Parliament returned no current members for broad name search')
  assert(result.data.items.length <= 3, `Expected at most 3 members, got ${result.data.items.length}`)
  assert.equal(result.data.take, 3, `Provider did not acknowledge take=3: ${JSON.stringify({ take: result.data.take, items: result.data.items.length })}`)
  assert.equal(result.data.skip, 0)

  const first = result.data.items[0]?.value || {}
  const membership = first.latestHouseMembership || {}
  const party = first.latestParty || {}
  const status = membership.membershipStatus || {}
  const dom = await b.ev(`(() => {
    const shell = document.querySelector('.demo-preview')
    const card = shell.querySelector('.parliament-members-preview')
    const row = card.querySelector('[data-member-index="1"]')
    const facts = Object.fromEntries([...row.querySelectorAll('.domain-facts > div')].map((item) => [item.querySelector('dt')?.textContent || '', item.querySelector('dd')?.textContent || '']))
    return {
      layout: shell.dataset.previewLayout,
      fallback: shell.dataset.ssotFallback,
      domain: card.dataset.domainCard,
      totalResults: Number(card.dataset.totalResults),
      take: Number(card.dataset.providerTake),
      skip: Number(card.dataset.providerSkip),
      memberId: Number(row.dataset.memberId),
      partyId: Number(row.dataset.partyId),
      house: Number(row.dataset.house),
      membershipFromId: row.dataset.membershipFromId === undefined ? null : Number(row.dataset.membershipFromId),
      active: row.dataset.membershipActive,
      status: row.dataset.membershipStatus,
      heading: row.querySelector('h4')?.innerText || '',
      facts,
      generic: (shell.innerText || '').includes('UK Parliament Members record 1'),
    }
  })()`)

  assert.equal(dom.layout, 'parliament-members')
  assert.equal(dom.fallback, 'false')
  assert.equal(dom.domain, 'parliament-members')
  assert.equal(dom.totalResults, Number(result.data.totalResults))
  assert.equal(dom.take, Number(result.data.take))
  assert.equal(dom.skip, Number(result.data.skip))
  assert.equal(dom.memberId, Number(first.id))
  assert.equal(dom.partyId, Number(party.id))
  assert.equal(dom.house, Number(membership.house))
  assert.equal(dom.membershipFromId, membership.membershipFromId === undefined || membership.membershipFromId === null ? null : Number(membership.membershipFromId))
  assert.equal(dom.active, status.statusIsActive === undefined ? undefined : String(status.statusIsActive))
  assert.equal(dom.status, String(status.statusDescription || (status.statusIsActive === true ? 'Current Member' : status.statusIsActive === false ? 'Inactive membership' : 'Status not supplied')))
  assert.equal(dom.heading, String(first.nameDisplayAs || first.nameFullTitle || ''))
  assert.equal(dom.facts.Party, String(party.name || 'Party not supplied'))
  assert.equal(dom.facts.House, membership.house === 1 ? 'House of Commons' : membership.house === 2 ? 'House of Lords' : membership.house == null ? 'House not supplied' : `House ${membership.house}`)
  assert.equal(dom.facts['Membership from'], String(membership.membershipFrom || 'Not supplied'))
  assert.equal(dom.generic, false)

  await b.viewport(390, 844)
  const overflow = await b.ev(`({
    documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    previewOverflow: document.querySelector('.demo-preview').scrollWidth > document.querySelector('.demo-preview').clientWidth + 1,
  })`)
  assert.equal(overflow.documentOverflow || overflow.previewOverflow, false, JSON.stringify(overflow))
  const ax = await b.call('Accessibility.getFullAXTree')
  assert.equal(unnamed(ax.nodes).length, 0)

  report.checks.push({
    id: 'uk-parliament-members',
    source: 'live provider',
    requestedName: 'a',
    requestedTake: 3,
    providerTake: result.data.take,
    returnedItems: result.data.items.length,
    totalResults: result.data.totalResults,
    memberIdentity: 'exact response match',
    partyAndMembership: 'exact response match',
    mobileOverflow: false,
    unnamedControls: 0,
  })
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

fs.writeFileSync(`${evidence}/uk-parliament-card.json`, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({ ...report, evidence: `${evidence}/uk-parliament-card.json` }, null, 2))
process.exit(report.verdict === 'PASS' ? 0 : 1)
