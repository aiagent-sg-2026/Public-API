import assert from 'node:assert/strict'
import fs from 'node:fs'
import { browser, evidence, root, sleep } from './lib/pages-origin-browser.mjs'

const report = {
  origin: 'https://yapweijun1996.github.io',
  publication: 'unpublished local app bundle under the real GitHub Pages origin',
  source: 'live Open-Meteo Historical Weather, Open-Meteo Climate, and NASA POWER Daily API responses',
  checks: [],
  errors: [],
}

const unnamed = (nodes) => nodes.filter((node) => !node.ignored
  && ['button', 'combobox', 'textbox', 'spinbutton', 'searchbox', 'tab', 'radio', 'link'].includes(node.role?.value)
  && !(node.name?.value || '').trim())

const setInput = async (b, name, value) => {
  await b.ev(`(() => {
    const input = document.querySelector('input[name=${JSON.stringify(name)}]');
    if (!input) throw Error('missing input: ${name}');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ${JSON.stringify(value)} }));
  })()`)
  await sleep(80)
}

const compactToIso = (value) => /^\d{8}$/.test(value)
  ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
  : value

let b
try {
  b = await browser(`${root}/dist`)

  await b.nav('open-meteo-history')
  const openMeteoInputs = await b.ev(`({
    startType: document.querySelector('input[name="startDate"]')?.type,
    endType: document.querySelector('input[name="endDate"]')?.type,
    endMin: document.querySelector('input[name="endDate"]')?.min,
  })`)
  assert.deepEqual(openMeteoInputs, { startType: 'date', endType: 'date', endMin: '2025-01-01' })
  await setInput(b, 'startDate', '2026-08-07')
  await setInput(b, 'endDate', '2026-08-03')
  assert.equal(await b.ev(`document.querySelector('input[name="endDate"]')?.min`), '2026-08-07')
  const beforeOpenMeteoInvalidRange = b.requestCount
  await b.ev(`document.querySelector('.parameter-card').requestSubmit()`)
  await sleep(150)
  assert.equal(b.requestCount, beforeOpenMeteoInvalidRange, 'Reversed Open-Meteo history range reached provider network')
  assert.equal(await b.ev(`document.querySelector('input[name="endDate"]')?.getAttribute('aria-invalid')`), 'true')
  assert.match(await b.ev(`document.querySelector('#parameter-endDate-help')?.textContent || ''`), /on or after Start date/)
  assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle')
  await setInput(b, 'startDate', '2026-08-03')
  await setInput(b, 'endDate', '2026-08-07')
  const openMeteoEndpoint = await b.ev(`document.querySelector('.endpoint-box code')?.textContent || ''`)
  const openMeteoUrl = new URL(openMeteoEndpoint)
  assert.equal(openMeteoUrl.searchParams.get('start_date'), '2026-08-03')
  assert.equal(openMeteoUrl.searchParams.get('end_date'), '2026-08-07')

  const openMeteo = await b.run()
  assert.equal(openMeteo.ok, true, openMeteo.error)
  assert.equal(openMeteo.data?.daily?.time?.[0], '2026-08-03')
  assert.equal(openMeteo.data?.daily?.time?.at(-1), '2026-08-07')
  const openMeteoDom = await b.ev(`(() => {
    const preview = document.querySelector('.demo-preview');
    const range = [...preview.querySelectorAll('.market-range span')].map((node) => node.textContent || '');
    const strong = preview.querySelector('.market-summary strong')?.textContent || '';
    return { layout: preview?.dataset.previewLayout || '', range, strong, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
  })()`)
  assert.equal(openMeteoDom.layout, 'market-chart')
  assert.deepEqual(openMeteoDom.range, ['2026-08-03', '2026-08-07'])
  assert.equal(Number(openMeteoDom.strong.replace(/[^0-9.-]/g, '')), Number(openMeteo.data.daily.temperature_2m_max.at(-1)))
  assert.equal(openMeteoDom.overflow, false)
  await b.viewport(390, 844)
  let mobile = await b.ev(`({
    documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    previewOverflow: document.querySelector('.demo-preview').scrollWidth > document.querySelector('.demo-preview').clientWidth + 1,
  })`)
  if (mobile.previewOverflow) {
    const overflowDetails = await b.ev(`(() => {
      const preview = document.querySelector('.demo-preview');
      return [...preview.querySelectorAll('*')].map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, className: typeof element.className === 'string' ? element.className : '', scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, left: rect.left, right: rect.right, width: rect.width, text: (element.textContent || '').trim().slice(0, 80) };
      }).filter((entry) => entry.scrollWidth > entry.clientWidth + 1 || entry.right > innerWidth + 0.5 || entry.left < -0.5).slice(0, 30);
    })()`);
    console.log(JSON.stringify({ openMeteoMobileOverflowDetails: overflowDetails }, null, 2));
  }
  assert.equal(mobile.documentOverflow || mobile.previewOverflow, false, JSON.stringify(mobile))
  let ax = await b.call('Accessibility.getFullAXTree')
  assert.equal(unnamed(ax.nodes).length, 0)
  report.checks.push({
    id: 'open-meteo-history',
    nativeDateInputs: true,
    wireFormat: 'YYYY-MM-DD',
    providerReturnedRange: [openMeteo.data.daily.time[0], openMeteo.data.daily.time.at(-1)],
    semanticRangeMatches: true,
    mobileOverflow: false,
    unnamedControls: 0,
  })

  await b.viewport(1440, 1000)
  await b.nav('nasa-power-climate')
  const nasaInputs = await b.ev(`({
    startType: document.querySelector('input[name="startDate"]')?.type,
    endType: document.querySelector('input[name="endDate"]')?.type,
  })`)
  assert.deepEqual(nasaInputs, { startType: 'date', endType: 'date' })
  await setInput(b, 'startDate', '2026-08-03')
  await setInput(b, 'endDate', '2026-08-07')
  const nasaEndpoint = await b.ev(`document.querySelector('.endpoint-box code')?.textContent || ''`)
  const nasaUrl = new URL(nasaEndpoint)
  assert.equal(nasaUrl.searchParams.get('start'), '20260803')
  assert.equal(nasaUrl.searchParams.get('end'), '20260807')

  const nasa = await b.run()
  assert.equal(nasa.ok, true, nasa.error)
  assert.equal(nasa.data?.header?.start, '20260803')
  assert.equal(nasa.data?.header?.end, '20260807')
  const t2m = nasa.data?.properties?.parameter?.T2M
  assert.equal(typeof t2m, 'object')
  const nasaDates = Object.keys(t2m || {})
  assert.equal(nasaDates[0], '20260803')
  assert.equal(nasaDates.at(-1), '20260807')
  const nasaLatest = Number(t2m[nasaDates.at(-1)])
  assert(Number.isFinite(nasaLatest))
  const nasaMetadata = nasa.data?.parameters?.T2M
  assert.equal(typeof nasaMetadata?.longname, 'string')
  assert.equal(typeof nasaMetadata?.units, 'string')

  const nasaDom = await b.ev(`(() => {
    const preview = document.querySelector('.demo-preview');
    const range = [...preview.querySelectorAll('.market-range span')].map((node) => node.textContent || '');
    const label = preview.querySelector('.market-summary > div:first-child > span')?.textContent || '';
    const strong = preview.querySelector('.market-summary strong')?.textContent || '';
    const metrics = Object.fromEntries([...preview.querySelectorAll('.market-metrics article')].map((node) => [node.querySelector('small')?.textContent || '', node.querySelector('strong')?.textContent || '']));
    return { layout: preview?.dataset.previewLayout || '', range, label, strong, metrics, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
  })()`)
  assert.equal(nasaDom.layout, 'market-chart')
  assert.deepEqual(nasaDom.range, [compactToIso(nasaDates[0]), compactToIso(nasaDates.at(-1))])
  assert.match(nasaDom.label, new RegExp(nasaMetadata.longname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.equal(Number(nasaDom.strong.replace(nasaMetadata.units, '').trim()), nasaLatest)
  assert.equal(nasaDom.metrics['Series length'], String(nasaDates.length))
  assert.equal(nasaDom.overflow, false)

  await b.viewport(390, 844)
  mobile = await b.ev(`({
    documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    previewOverflow: document.querySelector('.demo-preview').scrollWidth > document.querySelector('.demo-preview').clientWidth + 1,
  })`)
  assert.equal(mobile.documentOverflow || mobile.previewOverflow, false, JSON.stringify(mobile))
  ax = await b.call('Accessibility.getFullAXTree')
  assert.equal(unnamed(ax.nodes).length, 0)
  report.checks.push({
    id: 'nasa-power-climate',
    nativeDateInputs: true,
    humanDateFormat: 'YYYY-MM-DD',
    providerWireFormat: 'YYYYMMDD',
    providerHeaderRange: [nasa.data.header.start, nasa.data.header.end],
    responseShape: 'properties.parameter.<code>.<YYYYMMDD>',
    semanticSeriesMatches: true,
    semanticMetadataJoin: true,
    mobileOverflow: false,
    unnamedControls: 0,
  })

  await b.viewport(1440, 1000)
  await b.nav('open-meteo-climate')
  const climateModelContract = await b.ev(`(() => {
    const select = document.querySelector('select[name="model"]');
    return {
      value: select?.value || '',
      options: [...(select?.options || [])].map((option) => option.value),
    };
  })()`)
  assert.deepEqual(climateModelContract, {
    value: 'CMCC_CM2_VHR4',
    options: ['CMCC_CM2_VHR4', 'FGOALS_f3_H', 'HiRAM_SIT_HR', 'MRI_AGCM3_2_S', 'EC_Earth3P_HR', 'MPI_ESM1_2_XR', 'NICAM16_8S'],
  })
  assert.equal(await b.ev(`document.querySelector('input[name="endYear"]')?.min`), '2020')
  await setInput(b, 'startYear', '2030')
  await setInput(b, 'endYear', '2020')
  assert.equal(await b.ev(`document.querySelector('input[name="endYear"]')?.min`), '2030')
  const beforeClimateInvalidRange = b.requestCount
  await b.ev(`document.querySelector('.parameter-card').requestSubmit()`)
  await sleep(150)
  assert.equal(b.requestCount, beforeClimateInvalidRange, 'Reversed Open-Meteo Climate year range reached provider network')
  assert.equal(await b.ev(`document.querySelector('input[name="endYear"]')?.getAttribute('aria-invalid')`), 'true')
  assert.match(await b.ev(`document.querySelector('#parameter-endYear-help')?.textContent || ''`), /greater than or equal to Start year/)
  assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle')
  await setInput(b, 'startYear', '2025')
  await setInput(b, 'endYear', '2025')
  await b.ev(`(() => {
    const select = document.querySelector('select[name="model"]');
    select.value = 'MPI_ESM1_2_XR';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  })()`)
  await sleep(80)
  const climateEndpoint = await b.ev(`document.querySelector('.endpoint-box code')?.textContent || ''`)
  const climateUrl = new URL(climateEndpoint)
  assert.equal(climateUrl.searchParams.get('models'), 'MPI_ESM1_2_XR')
  assert.equal(climateUrl.searchParams.get('start_date'), '2025-01-01')
  assert.equal(climateUrl.searchParams.get('end_date'), '2025-12-31')

  const climate = await b.run()
  assert.equal(climate.ok, true, climate.error)
  assert.equal(climate.data?.daily?.time?.[0], '2025-01-01')
  assert.equal(climate.data?.daily?.time?.at(-1), '2025-12-31')
  const climateTemps = climate.data?.daily?.temperature_2m_mean || []
  assert.equal(climateTemps.length, climate.data.daily.time.length)
  assert(climateTemps.some((value) => Number.isFinite(Number(value))))
  const climateDom = await b.ev(`(() => {
    const preview = document.querySelector('.demo-preview');
    const card = preview?.querySelector('[data-domain-card="climate-projection"]');
    return {
      layout: preview?.dataset.previewLayout || '',
      model: card?.dataset.primaryModel || '',
      start: card?.dataset.periodStart || '',
      end: card?.dataset.periodEnd || '',
      count: Number(card?.dataset.observationCount || 0),
      resultState: card?.dataset.resultState || '',
      text: card?.textContent || '',
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  })()`)
  assert.equal(climateDom.layout, 'market-chart')
  assert.equal(climateDom.model, 'MPI_ESM1_2_XR')
  assert.equal(climateDom.start, '2025-01-01')
  assert.equal(climateDom.end, '2025-12-31')
  assert.equal(climateDom.count, climate.data.daily.time.length)
  assert.equal(climateDom.resultState, 'ready')
  assert.match(climateDom.text, /ModelMPI_ESM1_2_XR/)
  assert.match(climateDom.text, /Returned days365/)
  assert.equal(climateDom.overflow, false)

  await b.viewport(390, 844)
  mobile = await b.ev(`({
    documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    previewOverflow: document.querySelector('.demo-preview').scrollWidth > document.querySelector('.demo-preview').clientWidth + 1,
  })`)
  assert.equal(mobile.documentOverflow || mobile.previewOverflow, false, JSON.stringify(mobile))
  ax = await b.call('Accessibility.getFullAXTree')
  assert.equal(unnamed(ax.nodes).length, 0)
  report.checks.push({
    id: 'open-meteo-climate',
    documentedModelOptions: climateModelContract.options,
    selectedModel: 'MPI_ESM1_2_XR',
    providerReturnedRange: [climate.data.daily.time[0], climate.data.daily.time.at(-1)],
    semanticModelMatchesRequest: true,
    semanticSeriesMatches: true,
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

fs.writeFileSync(`${evidence}/climate-date-contracts.json`, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({ ...report, evidence: `${evidence}/climate-date-contracts.json` }, null, 2))
process.exit(report.verdict === 'PASS' ? 0 : 1)
