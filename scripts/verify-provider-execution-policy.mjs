import fs from 'node:fs';
import assert from 'node:assert/strict';
import { browser, evidence, root, sleep } from './lib/pages-origin-browser.mjs';

const report = {
  origin: 'https://yapweijun1996.github.io',
  publication: 'unpublished local app bundle',
  providerPolicy: 'Manual-only provider policies and bounded usage constraints are derived from the catalog SSOT',
  checks: [],
  errors: [],
};
console.log('Evidence directory:', evidence);

const colorFixtureUrl = 'https://www.thecolorapi.com/id?hex=24B1E0';
const colorFixture = {
  hex: { value: '#24b1e0' }, name: { value: 'Cerulean', exact_match_name: false, closest_named_hex: '#1DACD6' },
  rgb: { value: 'rgb(36, 177, 224)' }, hsl: { value: 'hsl(195, 75%, 51%)' },
  hsv: { value: 'hsv(195, 84%, 88%)' }, cmyk: { value: 'cmyk(84, 21, 0, 12)' },
  XYZ: { value: 'XYZ(46, 59, 92)' }, contrast: { value: '#000000' },
};
const b = await browser(root + '/dist', { fixtures: new Map([[colorFixtureUrl, { body: colorFixture }]]) });
try {
  await b.call('Page.navigate', { url: `${report.origin}/Public-API/#/catalog` });
  await b.wait(`Boolean(document.modelContext?.getTools) && document.querySelector('.agent-connection')?.textContent?.includes('Agent connected')`);
  const nativeTools = await b.ev(`document.modelContext.getTools().then(tools => tools.map(tool => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema })))`);
  assert.equal(nativeTools.length, 5);
  const nativeRunTool = nativeTools.find((tool) => tool.name === 'run_public_api_demo');
  assert(nativeRunTool);
  const nativeRunSchema = typeof nativeRunTool.inputSchema === 'string' ? JSON.parse(nativeRunTool.inputSchema) : nativeRunTool.inputSchema;
  const nativeRunIds = nativeRunSchema?.properties?.id?.enum ?? [];
  assert.equal(nativeRunIds.length, 193);
  assert(!nativeRunIds.includes('languagetool-grammar-check'));
  assert(!nativeRunIds.includes('nominatim-search'));
  assert(nativeRunIds.includes('color-api'));
  report.checks.push({ nativeWebMcp: 'PASS', browser: 'Chrome testing feature', registeredTools: nativeTools.map((tool) => tool.name).sort(), runnableIds: nativeRunIds.length });

  const getNativeToolSchema = (name) => {
    const tool = nativeTools.find((candidate) => candidate.name === name);
    assert(tool, `Missing native WebMCP tool: ${name}`);
    return typeof tool.inputSchema === 'string' ? JSON.parse(tool.inputSchema) : tool.inputSchema;
  };
  const executeNativeTool = async (name, input = {}) => {
    const inputJson = JSON.stringify(input);
    const result = await b.ev(`document.modelContext.getTools().then(async tools => {
      const tool = tools.find(candidate => candidate.name === ${JSON.stringify(name)});
      if (!tool) return { ok: false, message: 'WEBMCP_TOOL_NOT_FOUND' };
      try {
        const value = await document.modelContext.executeTool(tool, ${JSON.stringify(inputJson)});
        return { ok: true, value };
      } catch (error) {
        return { ok: false, message: String(error?.message || error) };
      }
    })`);
    if (result.ok && typeof result.value === 'string') {
      try {
        return { ...result, value: JSON.parse(result.value) };
      } catch {
        return result;
      }
    }
    return result;
  };
  const waitForCatalog = async () => {
    await b.wait(`document.querySelector('.table-footer')?.dataset.pageCount === '4' && document.querySelectorAll('input[name=\"selected-api\"]').length > 0`);
  };
  const setCatalogSearch = async (value) => {
    await b.ev(`(() => {
      const input = document.querySelector('.module-search input');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ${JSON.stringify(value)} }));
    })()`);
    await b.wait(`document.querySelector('.module-search input')?.value === ${JSON.stringify(value)}`);
    await sleep(50);
  };

  await waitForCatalog();
  const catalogDocumentationLinks = [];
  for (let page = 1; page <= 4; page += 1) {
    const pageLinks = await b.ev(`[...document.querySelectorAll('a[data-api-docs-for]')].map(link => ({ id: link.dataset.apiDocsFor, label: link.getAttribute('aria-label') || '' }))`);
    catalogDocumentationLinks.push(...pageLinks);
    if (page < 4) {
      await b.ev(`document.querySelector('button[aria-label="Next catalog page"]').click()`);
      await b.wait(`document.querySelector('.table-footer')?.dataset.catalogPage === ${JSON.stringify(String(page + 1))}`);
    }
  }
  assert.equal(catalogDocumentationLinks.length, 195);
  assert.equal(new Set(catalogDocumentationLinks.map((link) => link.id)).size, 195);
  assert.equal(new Set(catalogDocumentationLinks.map((link) => link.label)).size, 195);
  assert.deepEqual(catalogDocumentationLinks.find((link) => link.id === 'countries'), { id: 'countries', label: 'Open Country Explorer documentation' });
  assert.equal(await b.ev(`document.querySelectorAll('tbody tr[data-api-id]').length`), 45);
  report.checks.push({ catalogPagination: 'PASS', pageSize: 50, pages: 4, exactCoverage: 195, catalogDocumentationAccessibleNames: 'PASS', uniqueNames: 195 });

  const discoveryResult = await executeNativeTool('list_public_api_demos', { query: 'LanguageTool', category: 'Language' });
  assert.equal(discoveryResult.ok, true, discoveryResult.message);
  const discovery = discoveryResult.value;
  assert.equal(discovery.count, 1);
  assert.equal(discovery.demos[0].id, 'languagetool-grammar-check');
  assert.equal(discovery.demos[0].agentExecution.mode, 'manual-only');
  assert.match(discovery.demos[0].agentExecution.reason, /prohibits automated requests/i);
  assert.equal(discovery.demos[0].agentExecution.policyUrl, 'https://dev.languagetool.org/public-http-api.html');
  assert.match(discovery.demos[0].usageNote, /interactive, human-driven checks/i);

  const nominatimDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'Nominatim', category: 'Geo' });
  assert.equal(nominatimDiscoveryResult.ok, true, nominatimDiscoveryResult.message);
  const nominatimDiscovery = nominatimDiscoveryResult.value;
  assert.equal(nominatimDiscovery.count, 1);
  assert.equal(nominatimDiscovery.demos[0].id, 'nominatim-search');
  assert.equal(nominatimDiscovery.demos[0].agentExecution.mode, 'manual-only');
  assert.equal(nominatimDiscovery.demos[0].agentExecution.policyUrl, 'https://operations.osmfoundation.org/policies/nominatim/');
  assert.match(nominatimDiscovery.demos[0].usageNote, /one request per second/i);
  assert.match(nominatimDiscovery.demos[0].usageNote, /LLM\/platform policy/i);

  const taskDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'please show me an API for package vulnerabilities', category: 'Developer' });
  assert.equal(taskDiscoveryResult.ok, true, taskDiscoveryResult.message);
  assert.equal(taskDiscoveryResult.value.count, 1);
  assert.equal(taskDiscoveryResult.value.demos[0].id, 'deps-dev');
  assert(taskDiscoveryResult.value.demos[0].keywords.includes('package vulnerabilities'));

  const geocodeDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'can you find me an address geocoder', category: 'Geo' });
  assert.equal(geocodeDiscoveryResult.ok, true, geocodeDiscoveryResult.message);
  assert.equal(geocodeDiscoveryResult.value.count, 1);
  assert.equal(geocodeDiscoveryResult.value.demos[0].id, 'nominatim-search');
  report.checks.push({ capabilityDiscovery: 'PASS', nativeQueries: ['please show me an API for package vulnerabilities', 'can you find me an address geocoder'], sharedKeywordSsot: true });

  const machineHead = await b.ev(`(() => {
    const link = document.querySelector('link[rel="alternate"][type="application/json"]');
    return { href: link?.href || '', title: link?.getAttribute('title') || '' };
  })()`);
  assert.equal(machineHead.href, `${report.origin}/Public-API/api-catalog.json`);
  assert.equal(machineHead.title, 'Public API machine catalog');
  const machineResponse = await b.ev(`fetch('/Public-API/api-catalog.json', {cache:'no-store'}).then(async response => ({
    status: response.status,
    contentType: response.headers.get('content-type') || '',
    body: await response.json(),
  }))`);
  assert.equal(machineResponse.status, 200);
  assert.match(machineResponse.contentType, /application\/json/i);
  assert.equal(machineResponse.body.schemaVersion, 1);
  assert.equal(machineResponse.body.catalogCount, 195);
  assert.equal(machineResponse.body.health, 'not-included');
  assert.equal(machineResponse.body.apis.length, 195);
  assert(!machineResponse.body.apis.some((api) => api.id === 'musicbrainz-artist-search'));
  assert(!machineResponse.body.apis.some((api) => api.id === 'yahoo-finance-sgx-history'));
  assert(!machineResponse.body.apis.some((api) => api.id === 'gutendex-books'));
  assert(!machineResponse.body.apis.some((api) => api.id === 'crates-io-search'));
  assert(!machineResponse.body.apis.some((api) => api.id === 'nws-weather'));
  const machineLanguageTool = machineResponse.body.apis.find((api) => api.id === 'languagetool-grammar-check');
  const machineNominatim = machineResponse.body.apis.find((api) => api.id === 'nominatim-search');
  const machineColor = machineResponse.body.apis.find((api) => api.id === 'color-api');
  const machineCelestrak = machineResponse.body.apis.find((api) => api.id === 'celestrak-satellites');
  const machineGeoBoundaries = machineResponse.body.apis.find((api) => api.id === 'geoboundaries-admin-boundaries');
  const machineExchangeRates = machineResponse.body.apis.find((api) => api.id === 'exchange-rate-current');
  const machineBrasilPostcode = machineResponse.body.apis.find((api) => api.id === 'brasilapi-postcode');
  const machineUniprot = machineResponse.body.apis.find((api) => api.id === 'uniprot-protein');
  const machinePdb = machineResponse.body.apis.find((api) => api.id === 'rcsb-pdb-entry');
  const machineFirstEpss = machineResponse.body.apis.find((api) => api.id === 'first-epss');
  const machineCircl = machineResponse.body.apis.find((api) => api.id === 'circl-vulnerability');
  const machineUnhcr = machineResponse.body.apis.find((api) => api.id === 'unhcr-refugees');
  const machineApple = machineResponse.body.apis.find((api) => api.id === 'apple-itunes-search');
  const machineZippopotam = machineResponse.body.apis.find((api) => api.id === 'zippopotam-postcode');
  assert.equal(machineLanguageTool.agentExecution.mode, 'manual-only');
  assert.equal(machineNominatim.agentExecution.mode, 'manual-only');
  assert.equal(machineColor.agentExecution.mode, 'enabled');
  assert.deepEqual({ pattern: machineColor.parameters.find((field) => field.id === 'hex')?.pattern, patternDescription: machineColor.parameters.find((field) => field.id === 'hex')?.patternDescription }, { pattern: '#?(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})', patternDescription: 'must be a 3- or 6-digit hexadecimal color, with an optional leading #.' });
  assert.equal(machineResponse.body.automatedVerificationDefault.mode, 'enabled');
  assert.equal(machineColor.automatedVerification, undefined);
  assert.equal(machineCelestrak.automatedVerification.mode, 'cadence-limited');
  assert.equal(machineCelestrak.automatedVerification.minimumIntervalSeconds, 7200);
  assert.equal(machineCelestrak.automatedVerification.retryOnNon2xx, false);
  assert.equal(machineCelestrak.automatedVerification.policyUrl, 'https://celestrak.org/usage-policy.php');
  assert.deepEqual(machineCelestrak.parameters.find((field) => field.id === 'group')?.options?.map((option) => option.value), ['stations', 'gps-ops']);
  assert.match(machineCelestrak.usageNote, /excludes large Active and Starlink groups/i);
  assert.deepEqual(machineGeoBoundaries.parameters.find((field) => field.id === 'countryIso'), {
    id: 'countryIso', label: 'Country ISO', type: 'text', defaultValue: 'SGP', help: 'Use an ISO 3166-1 alpha-3 country code such as SGP, GBR, or USA; geoBoundaries also accepts ALL.', minLength: 3, maxLength: 3,
    pattern: '[A-Za-z]{3}', patternDescription: 'must contain exactly three letters (an ISO 3166-1 alpha-3 code or the special ALL code).',
  });
  assert.deepEqual(machineGeoBoundaries.parameters.find((field) => field.id === 'adminLevel')?.options?.map((option) => option.value), ['ADM0', 'ADM1', 'ADM2', 'ADM3', 'ADM4', 'ADM5']);
  assert.match(machineGeoBoundaries.usageNote, /attribution/i);
  assert(machineExchangeRates.keywords.includes('currency conversion'));
  assert.deepEqual({ pattern: machineBrasilPostcode.parameters.find((field) => field.id === 'postcode')?.pattern, patternDescription: machineBrasilPostcode.parameters.find((field) => field.id === 'postcode')?.patternDescription }, { pattern: '\\d{5}-?\\d{3}', patternDescription: 'must contain exactly eight digits, optionally formatted as 12345-678.' });
  assert.deepEqual({ pattern: machineUniprot.parameters.find((field) => field.id === 'accession')?.pattern, patternDescription: machineUniprot.parameters.find((field) => field.id === 'accession')?.patternDescription }, { pattern: '[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9](?:[A-Z][A-Z0-9]{2}[0-9]){1,2}', patternDescription: 'must be a valid 6- or 10-character UniProtKB accession.' });
  assert.deepEqual({ minLength: machinePdb.parameters.find((field) => field.id === 'entryId')?.minLength, maxLength: machinePdb.parameters.find((field) => field.id === 'entryId')?.maxLength, pattern: machinePdb.parameters.find((field) => field.id === 'entryId')?.pattern }, { minLength: 4, maxLength: 12, pattern: '(?:[A-Za-z0-9]{4}|[Pp][Dd][Bb]_0000[A-Za-z0-9]{4})' });
  assert.match(machinePdb.usageNote || '', /July 21, 2027/);
  for (const machineApi of [machineFirstEpss, machineCircl]) {
    assert.deepEqual({ pattern: machineApi.parameters.find((field) => field.id === 'cve')?.pattern, patternDescription: machineApi.parameters.find((field) => field.id === 'cve')?.patternDescription }, { pattern: 'CVE-[0-9]{4}-[0-9]{4,}', patternDescription: 'must use the CVE-YYYY-NNNN format with four or more sequence digits.' });
  }
  assert.deepEqual({ minLength: machineUnhcr.parameters.find((field) => field.id === 'origin')?.minLength, maxLength: machineUnhcr.parameters.find((field) => field.id === 'origin')?.maxLength, pattern: machineUnhcr.parameters.find((field) => field.id === 'origin')?.pattern }, { minLength: 3, maxLength: 3, pattern: '[A-Za-z]{3}' });
  for (const machineApi of [machineApple, machineZippopotam]) {
    assert.deepEqual({ minLength: machineApi.parameters.find((field) => field.id === 'country')?.minLength, maxLength: machineApi.parameters.find((field) => field.id === 'country')?.maxLength, pattern: machineApi.parameters.find((field) => field.id === 'country')?.pattern }, { minLength: 2, maxLength: 2, pattern: '[A-Za-z]{2}' });
  }
  assert.deepEqual(machineApple.parameters.map((field) => field.id), ['query', 'entity', 'country', 'limit']);
  assert.deepEqual(machineApple.parameters.find((field) => field.id === 'entity')?.options?.map((option) => option.value), ['song', 'musicTrack', 'album', 'musicArtist', 'musicVideo', 'mix', 'podcast', 'podcastAuthor']);
  const machineAladhan = machineResponse.body.apis.find((api) => api.id === 'aladhan-prayer-times');
  assert.equal(machineAladhan.parameters.find((field) => field.id === 'date')?.type, 'date');
  const machineAladhanMethod = machineAladhan.parameters.find((field) => field.id === 'method');
  assert.equal(machineAladhanMethod?.type, 'select');
  assert(machineAladhanMethod?.options?.some((option) => option.value === '0'));
  assert(!machineAladhanMethod?.options?.some((option) => option.value === '6'));
  assert(!machineAladhanMethod?.options?.some((option) => option.value === '99'));
  const machineOpenMeteoHistory = machineResponse.body.apis.find((api) => api.id === 'open-meteo-history');
  const machineNasaPower = machineResponse.body.apis.find((api) => api.id === 'nasa-power-climate');
  const machineOpenMeteoClimate = machineResponse.body.apis.find((api) => api.id === 'open-meteo-climate');
  for (const machineClimateApi of [machineOpenMeteoHistory, machineNasaPower]) {
    assert.equal(machineClimateApi.parameters.find((field) => field.id === 'startDate')?.type, 'date');
    assert.equal(machineClimateApi.parameters.find((field) => field.id === 'endDate')?.type, 'date');
  }
  assert.deepEqual(machineOpenMeteoClimate.parameters.find((field) => field.id === 'model')?.options?.map((option) => option.value), ['CMCC_CM2_VHR4', 'FGOALS_f3_H', 'HiRAM_SIT_HR', 'MRI_AGCM3_2_S', 'EC_Earth3P_HR', 'MPI_ESM1_2_XR', 'NICAM16_8S']);
  const machineUsaspending = machineResponse.body.apis.find((api) => api.id === 'usaspending');
  assert.deepEqual(machineUsaspending.parameters.map((field) => field.id), ['fiscalYear', 'limit']);
  const machineUsaspendingFiscalYear = machineUsaspending.parameters.find((field) => field.id === 'fiscalYear');
  const machineUsaspendingLimit = machineUsaspending.parameters.find((field) => field.id === 'limit');
  assert.equal(machineUsaspendingFiscalYear.type, 'number');
  assert.equal(machineUsaspendingFiscalYear.min, 2008);
  assert(machineUsaspendingFiscalYear.max >= Number(machineUsaspendingFiscalYear.defaultValue));
  assert.deepEqual({ min: machineUsaspendingLimit.min, max: machineUsaspendingLimit.max }, { min: 1, max: 20 });
  assert.equal(Object.hasOwn(machineColor, 'buildUrl'), false);

  await b.ev(`location.hash='#/agent-tools'`);
  await b.wait(`Boolean(document.querySelector('[data-agent-catalog="api-catalog-json"]'))`);
  const machineDom = await b.ev(`(() => {
    const link = document.querySelector('[data-agent-catalog="api-catalog-json"]');
    return { href: link?.href || '', text: link?.innerText || '', height: link?.getBoundingClientRect().height || 0 };
  })()`);
  assert.equal(machineDom.href, `${report.origin}/Public-API/api-catalog.json`);
  assert.match(machineDom.text, /Machine-readable API catalog/i);
  assert(machineDom.height >= 44);
  await b.ev(`location.hash='#/catalog'`);
  await waitForCatalog();

  const celestrakDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'CelesTrak', category: 'Geo' });
  assert.equal(celestrakDiscoveryResult.ok, true, celestrakDiscoveryResult.message);
  const celestrakDiscovery = celestrakDiscoveryResult.value;
  assert.equal(celestrakDiscovery.count, 1);
  assert.equal(celestrakDiscovery.demos[0].agentExecution.mode, 'enabled');
  assert.equal(celestrakDiscovery.demos[0].automatedVerification.mode, 'cadence-limited');
  assert.equal(celestrakDiscovery.demos[0].automatedVerification.minimumIntervalSeconds, 7200);
  assert.equal(celestrakDiscovery.demos[0].automatedVerification.retryOnNon2xx, false);
  assert.equal(celestrakDiscovery.demos[0].automatedVerification.policyUrl, 'https://celestrak.org/usage-policy.php');
  assert.deepEqual(celestrakDiscovery.demos[0].parameters.find((field) => field.id === 'group')?.options?.map((option) => option.value), ['stations', 'gps-ops']);
  assert.match(celestrakDiscovery.demos[0].usageNote, /excludes large Active and Starlink groups/i);

  const cityBikesDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'CityBikes', category: 'Geo' });
  assert.equal(cityBikesDiscoveryResult.ok, true, cityBikesDiscoveryResult.message);
  const cityBikesDiscovery = cityBikesDiscoveryResult.value;
  assert.equal(cityBikesDiscovery.count, 1);
  assert.equal(cityBikesDiscovery.demos[0].agentExecution.mode, 'enabled');
  assert.match(cityBikesDiscovery.demos[0].usageNote, /300 requests\/hour/i);
  assert.match(cityBikesDiscovery.demos[0].usageNote, /source link/i);

  const geoBoundariesDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'geoBoundaries', category: 'Geo' });
  assert.equal(geoBoundariesDiscoveryResult.ok, true, geoBoundariesDiscoveryResult.message);
  const geoBoundariesDiscovery = geoBoundariesDiscoveryResult.value;
  assert.equal(geoBoundariesDiscovery.count, 1);
  const geoCountryIso = geoBoundariesDiscovery.demos[0].parameters.find((field) => field.id === 'countryIso');
  const geoAdminLevel = geoBoundariesDiscovery.demos[0].parameters.find((field) => field.id === 'adminLevel');
  assert.deepEqual({ minLength: geoCountryIso.minLength, maxLength: geoCountryIso.maxLength, pattern: geoCountryIso.pattern }, { minLength: 3, maxLength: 3, pattern: '[A-Za-z]{3}' });
  assert(geoAdminLevel.options.some((option) => option.value === 'ADM3'));

  const colorDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'Color API', category: 'Utility' });
  assert.equal(colorDiscoveryResult.ok, true, colorDiscoveryResult.message);
  assert.equal(colorDiscoveryResult.value.count, 1);
  const colorHexField = colorDiscoveryResult.value.demos[0].parameters.find((field) => field.id === 'hex');
  assert.equal(colorHexField?.pattern, '#?(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})');
  assert.match(colorHexField?.patternDescription || '', /3- or 6-digit hexadecimal/i);

  const aladhanDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'AlAdhan', category: 'Calendar' });
  assert.equal(aladhanDiscoveryResult.ok, true, aladhanDiscoveryResult.message);
  const aladhanDiscovery = aladhanDiscoveryResult.value;
  assert.equal(aladhanDiscovery.count, 1);
  assert.equal(aladhanDiscovery.demos[0].parameters.find((field) => field.id === 'date')?.type, 'date');
  const aladhanMethodDiscovery = aladhanDiscovery.demos[0].parameters.find((field) => field.id === 'method');
  assert.equal(aladhanMethodDiscovery?.type, 'select');
  assert(aladhanMethodDiscovery?.options?.some((option) => option.value === '0'));
  assert(!aladhanMethodDiscovery?.options?.some((option) => option.value === '99'));

  const bankDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'Bank of Canada Valet', category: 'Finance' });
  assert.equal(bankDiscoveryResult.ok, true, bankDiscoveryResult.message);
  const bankDiscovery = bankDiscoveryResult.value;
  assert.equal(bankDiscovery.count, 1);
  assert.equal(bankDiscovery.demos[0].parameters.find((field) => field.id === 'startDate')?.type, 'date');
  assert.equal(bankDiscovery.demos[0].parameters.find((field) => field.id === 'endDate')?.type, 'date');
  assert.equal(bankDiscovery.demos[0].parameters.find((field) => field.id === 'endDate')?.minimumFromField, 'startDate');

  const openMeteoHistoryDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'Historical Weather', category: 'Weather' });
  assert.equal(openMeteoHistoryDiscoveryResult.ok, true, openMeteoHistoryDiscoveryResult.message);
  const openMeteoHistoryDiscovery = openMeteoHistoryDiscoveryResult.value;
  assert.equal(openMeteoHistoryDiscovery.count, 1);
  assert.equal(openMeteoHistoryDiscovery.demos[0].parameters.find((field) => field.id === 'startDate')?.type, 'date');
  assert.equal(openMeteoHistoryDiscovery.demos[0].parameters.find((field) => field.id === 'endDate')?.type, 'date');
  assert.equal(openMeteoHistoryDiscovery.demos[0].parameters.find((field) => field.id === 'endDate')?.minimumFromField, 'startDate');

  const nasaPowerDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'NASA POWER Climate', category: 'Environment' });
  assert.equal(nasaPowerDiscoveryResult.ok, true, nasaPowerDiscoveryResult.message);
  const nasaPowerDiscovery = nasaPowerDiscoveryResult.value;
  assert.equal(nasaPowerDiscovery.count, 1);
  assert.equal(nasaPowerDiscovery.demos[0].parameters.find((field) => field.id === 'startDate')?.type, 'date');
  assert.equal(nasaPowerDiscovery.demos[0].parameters.find((field) => field.id === 'endDate')?.type, 'date');
  assert.equal(nasaPowerDiscovery.demos[0].parameters.find((field) => field.id === 'endDate')?.minimumFromField, 'startDate');

  const openMeteoClimateDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'Open-Meteo Climate', category: 'Environment' });
  assert.equal(openMeteoClimateDiscoveryResult.ok, true, openMeteoClimateDiscoveryResult.message);
  const openMeteoClimateDiscovery = openMeteoClimateDiscoveryResult.value;
  assert.equal(openMeteoClimateDiscovery.count, 1);
  const openMeteoClimateModel = openMeteoClimateDiscovery.demos[0].parameters.find((field) => field.id === 'model');
  assert.equal(openMeteoClimateModel?.defaultValue, 'CMCC_CM2_VHR4');
  assert.deepEqual(openMeteoClimateModel?.options?.map((option) => option.value), ['CMCC_CM2_VHR4', 'FGOALS_f3_H', 'HiRAM_SIT_HR', 'MRI_AGCM3_2_S', 'EC_Earth3P_HR', 'MPI_ESM1_2_XR', 'NICAM16_8S']);
  assert.equal(openMeteoClimateDiscovery.demos[0].parameters.find((field) => field.id === 'endYear')?.minimumFromField, 'startYear');

  const frankfurterDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'SGD/MYR FX History', category: 'Finance' });
  assert.equal(frankfurterDiscoveryResult.ok, true, frankfurterDiscoveryResult.message);
  const frankfurterDiscovery = frankfurterDiscoveryResult.value;
  assert.equal(frankfurterDiscovery.count, 1);
  assert.equal(frankfurterDiscovery.demos[0].parameters.find((field) => field.id === 'from')?.type, 'date');
  assert.equal(frankfurterDiscovery.demos[0].parameters.find((field) => field.id === 'to')?.type, 'date');
  assert.equal(frankfurterDiscovery.demos[0].parameters.find((field) => field.id === 'to')?.minimumFromField, 'from');

  const mlbDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'MLB Stats', category: 'Sports' });
  assert.equal(mlbDiscoveryResult.ok, true, mlbDiscoveryResult.message);
  const mlbDiscovery = mlbDiscoveryResult.value;
  assert.equal(mlbDiscovery.count, 1);
  assert.equal(mlbDiscovery.demos[0].parameters.find((field) => field.id === 'date')?.type, 'date');
  assert.deepEqual(mlbDiscovery.demos[0].parameters.map((field) => field.id), ['date', 'sportId']);

  const brasilDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'Brazil Postcode', category: 'Geo' });
  assert.equal(brasilDiscoveryResult.ok, true, brasilDiscoveryResult.message);
  const brasilDiscovery = brasilDiscoveryResult.value;
  assert.equal(brasilDiscovery.count, 1);
  const brasilPostcodeField = brasilDiscovery.demos[0].parameters.find((field) => field.id === 'postcode');
  assert.equal(brasilPostcodeField?.pattern, '\\d{5}-?\\d{3}');
  assert.match(brasilPostcodeField?.patternDescription || '', /exactly eight digits/i);

  const uniprotDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'UniProt Protein', category: 'Research' });
  assert.equal(uniprotDiscoveryResult.ok, true, uniprotDiscoveryResult.message);
  const uniprotDiscovery = uniprotDiscoveryResult.value;
  assert.equal(uniprotDiscovery.count, 1);
  const uniprotAccessionField = uniprotDiscovery.demos[0].parameters.find((field) => field.id === 'accession');
  assert.equal(uniprotAccessionField?.pattern, '[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9](?:[A-Z][A-Z0-9]{2}[0-9]){1,2}');
  assert.match(uniprotAccessionField?.patternDescription || '', /6- or 10-character UniProtKB accession/i);

  const pdbDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'RCSB Protein Data Bank', category: 'Research' });
  assert.equal(pdbDiscoveryResult.ok, true, pdbDiscoveryResult.message);
  const pdbDiscovery = pdbDiscoveryResult.value;
  assert.equal(pdbDiscovery.count, 1);
  const pdbEntryField = pdbDiscovery.demos[0].parameters.find((field) => field.id === 'entryId');
  assert.deepEqual({ minLength: pdbEntryField?.minLength, maxLength: pdbEntryField?.maxLength, pattern: pdbEntryField?.pattern }, { minLength: 4, maxLength: 12, pattern: '(?:[A-Za-z0-9]{4}|[Pp][Dd][Bb]_0000[A-Za-z0-9]{4})' });
  assert.match(pdbDiscovery.demos[0].usageNote || '', /extended PDB IDs/i);

  for (const [query, category, id] of [['FIRST EPSS', 'Developer', 'first-epss'], ['CIRCL Vulnerability', 'Security', 'circl-vulnerability']]) {
    const cveDiscoveryResult = await executeNativeTool('list_public_api_demos', { query, category });
    assert.equal(cveDiscoveryResult.ok, true, cveDiscoveryResult.message);
    assert.equal(cveDiscoveryResult.value.count, 1);
    assert.equal(cveDiscoveryResult.value.demos[0].id, id);
    const cveField = cveDiscoveryResult.value.demos[0].parameters.find((field) => field.id === 'cve');
    assert.equal(cveField?.pattern, 'CVE-[0-9]{4}-[0-9]{4,}');
    assert.match(cveField?.patternDescription || '', /four or more sequence digits/i);
  }

  for (const [query, category, id, fieldId, pattern] of [
    ['UNHCR Refugee Statistics', 'Data', 'unhcr-refugees', 'origin', '[A-Za-z]{3}'],
    ['Apple iTunes Search', 'Media', 'apple-itunes-search', 'country', '[A-Za-z]{2}'],
    ['Zippopotam Postcode', 'Geo', 'zippopotam-postcode', 'country', '[A-Za-z]{2}'],
  ]) {
    const result = await executeNativeTool('list_public_api_demos', { query, category });
    assert.equal(result.ok, true, result.message);
    assert.equal(result.value.count, 1);
    assert.equal(result.value.demos[0].id, id);
    assert.equal(result.value.demos[0].parameters.find((field) => field.id === fieldId)?.pattern, pattern);
  }

  const appleDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'Apple iTunes Search', category: 'Media' });
  assert.equal(appleDiscoveryResult.ok, true, appleDiscoveryResult.message);
  const appleDiscovery = appleDiscoveryResult.value.demos[0];
  assert.deepEqual(appleDiscovery.parameters.map((field) => field.id), ['query', 'entity', 'country', 'limit']);
  assert.deepEqual(appleDiscovery.parameters.find((field) => field.id === 'entity')?.options?.map((option) => option.value), ['song', 'musicTrack', 'album', 'musicArtist', 'musicVideo', 'mix', 'podcast', 'podcastAuthor']);

  const usaspendingDiscoveryResult = await executeNativeTool('list_public_api_demos', { query: 'USAspending Contract Awards', category: 'Government' });
  assert.equal(usaspendingDiscoveryResult.ok, true, usaspendingDiscoveryResult.message);
  const usaspendingDiscovery = usaspendingDiscoveryResult.value;
  assert.equal(usaspendingDiscovery.count, 1);
  assert.equal(usaspendingDiscovery.demos[0].id, 'usaspending');
  assert.deepEqual(usaspendingDiscovery.demos[0].parameters.map((field) => field.id), ['fiscalYear', 'limit']);
  assert.equal(usaspendingDiscovery.demos[0].parameters.find((field) => field.id === 'fiscalYear')?.min, 2008);
  assert.equal(usaspendingDiscovery.demos[0].parameters.find((field) => field.id === 'limit')?.max, 20);

  const runIds = getNativeToolSchema('run_public_api_demo').properties.id.enum;
  assert(!runIds.includes('languagetool-grammar-check'));
  assert(!runIds.includes('nominatim-search'));
  assert(!runIds.includes('yahoo-finance-sgx-history'));
  assert(!runIds.includes('gutendex-books'));
  assert(!runIds.includes('crates-io-search'));
  assert(!runIds.includes('nws-weather'));
  assert(runIds.includes('color-api'));
  assert.equal(runIds.length, 193);
  const openIds = getNativeToolSchema('open_public_api_demo').properties.id.enum;
  const removedIds = ['musicbrainz-artist-search', 'yahoo-finance-sgx-history', 'gutendex-books', 'crates-io-search', 'nws-weather'];
  for (const removedId of removedIds) assert(!openIds.includes(removedId));
  for (const removedId of removedIds) {
    assert.equal(await b.ev(`Boolean(document.querySelector('[data-api-id=${JSON.stringify(removedId)}]'))`), false);
    await b.ev(`location.hash=${JSON.stringify(`#/request-lab?api=${removedId}`)}`);
    await b.wait(`document.querySelector('.request-lab')?.dataset.apiId === 'countries'`);
    assert.equal(await b.ev(`location.hash`), '#/request-lab?api=countries');
  }
  report.checks.push({ removedProviderDeepLinks: 'PASS', removed: removedIds, canonicalFallback: 'countries' });
  await b.ev(`location.hash='#/catalog'`);
  await waitForCatalog();
  const machineRunnableIds = machineResponse.body.apis.filter((api) => api.agentExecution.mode === 'enabled').map((api) => api.id).sort();
  assert.deepEqual([...runIds].sort(), machineRunnableIds);
  report.checks.push({ machineCatalog: 'PASS', count: machineResponse.body.catalogCount, health: machineResponse.body.health, headDiscovery: 'PASS', domDiscovery: 'PASS', runnablePolicyAligned: true, textLengthContract: 'PASS', dateContract: 'PASS' });
  report.checks.push({ discovery: 'PASS', runnableIds: runIds.length, languageTool: 'manual-only', nominatim: 'manual-only', celestrakVerification: 'cadence-limited', cityBikes: 'enabled-with-usage-note', geoBoundariesTextLength: '3 letters / ISO alpha-3 or ALL', colorHexPattern: '3 or 6 hex digits with optional #', uniprotAccessionPattern: 'official 6/10-character UniProtKB accession syntax', pdbEntryPattern: '4-character ID or transitional pdb_0000XXXX alias; future extended-only IDs blocked pending 2027 cutover', cveIdPattern: 'CVE-YYYY-NNNN with 4+ sequence digits', openMeteoClimateModels: '7 current documented HighResMIP models', aladhanDateType: 'date', aladhanMethodContract: 'built-in select incl. 0, excluding custom 99', bankOfCanadaDateType: 'date', historicalWeatherDateType: 'date', nasaPowerDateType: 'date', frankfurterDateType: 'date', mlbDateType: 'date', brasilCepPattern: '8 digits with optional standard hyphen', isoCountryCodePatterns: 'UNHCR alpha-3; Apple/Zippopotam alpha-2', usaspendingParameters: 'fiscalYear+limit' });

  const beforeInvalidAgentInput = b.requestCount;
  const invalidAgentInput = await executeNativeTool('run_public_api_demo', { id: 'people', parameters: { count: 3, nationality: 'xx' } });
  assert.equal(invalidAgentInput.ok, false);
  await sleep(150);
  assert.equal(b.requestCount, beforeInvalidAgentInput, 'Invalid WebMCP select input reached a provider request');
  await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === 'people'`);
  assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle');
  report.checks.push({ structuredInputValidation: 'PASS', api: 'people', invalidField: 'nationality', networkRequests: 0, stateAfterBlock: 'idle' });

  const beforeUnknownParameter = b.requestCount;
  const unknownParameter = await executeNativeTool('run_public_api_demo', { id: 'mlb-stats-api', parameters: { teamId: '147' } });
  assert.equal(unknownParameter.ok, false);
  await sleep(150);
  assert.equal(b.requestCount, beforeUnknownParameter, 'Undeclared MLB teamId reached a provider request');
  await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === 'mlb-stats-api'`);
  assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle');
  report.checks.push({ structuredUnknownParameterValidation: 'PASS', api: 'mlb-stats-api', invalidField: 'teamId', networkRequests: 0, stateAfterBlock: 'idle' });

  const beforeInvalidAppleEntity = b.requestCount;
  const invalidAppleEntity = await executeNativeTool('run_public_api_demo', { id: 'apple-itunes-search', parameters: { entity: 'bogus' } });
  assert.equal(invalidAppleEntity.ok, false);
  await sleep(150);
  assert.equal(b.requestCount, beforeInvalidAppleEntity, 'Invalid Apple entity reached a provider request');
  await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === 'apple-itunes-search'`);
  assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle');
  report.checks.push({ structuredSelectValidation: 'PASS', api: 'apple-itunes-search', invalidField: 'entity', invalidValue: 'bogus', networkRequests: 0, stateAfterBlock: 'idle' });

  const beforeInvalidBrasilCep = b.requestCount;
  const invalidBrasilCep = await executeNativeTool('run_public_api_demo', { id: 'brasilapi-postcode', parameters: { postcode: '01310-930abc' } });
  assert.equal(invalidBrasilCep.ok, false);
  await sleep(150);
  assert.equal(b.requestCount, beforeInvalidBrasilCep, 'Invalid Brazilian CEP reached a provider request');
  await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === 'brasilapi-postcode'`);
  assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle');
  report.checks.push({ structuredPatternValidation: 'PASS', api: 'brasilapi-postcode', invalidField: 'postcode', invalidValue: '01310-930abc', networkRequests: 0, stateAfterBlock: 'idle' });

  for (const [id, field, value] of [['color-api', 'hex', 'GGGGGG'], ['geoboundaries-admin-boundaries', 'countryIso', '123']]) {
    const beforeInvalidPattern = b.requestCount;
    const invalidPattern = await executeNativeTool('run_public_api_demo', { id, parameters: { [field]: value } });
    assert.equal(invalidPattern.ok, false);
    await sleep(150);
    assert.equal(b.requestCount, beforeInvalidPattern, `Invalid ${id}.${field} reached a provider request`);
    await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === ${JSON.stringify(id)}`);
    assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle');
    report.checks.push({ structuredPatternValidation: 'PASS', api: id, invalidField: field, invalidValue: value, networkRequests: 0, stateAfterBlock: 'idle' });
  }


  for (const [id, field, value] of [
    ['unhcr-refugees', 'origin', '123'],
    ['apple-itunes-search', 'country', '12'],
    ['zippopotam-postcode', 'country', '1x'],
  ]) {
    const beforeInvalidCountryCode = b.requestCount;
    const invalidCountryCode = await executeNativeTool('run_public_api_demo', { id, parameters: { [field]: value } });
    assert.equal(invalidCountryCode.ok, false);
    await sleep(150);
    assert.equal(b.requestCount, beforeInvalidCountryCode, `Invalid ${id}.${field} reached a provider request`);
    await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === ${JSON.stringify(id)}`);
    assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle');
    report.checks.push({ structuredCountryCodeValidation: 'PASS', api: id, invalidField: field, invalidValue: value, networkRequests: 0, stateAfterBlock: 'idle' });
  }

  for (const id of ['first-epss', 'circl-vulnerability']) {
    const beforeInvalidCve = b.requestCount;
    const invalidCve = await executeNativeTool('run_public_api_demo', { id, parameters: { cve: 'not-a-cve' } });
    assert.equal(invalidCve.ok, false);
    await sleep(150);
    assert.equal(b.requestCount, beforeInvalidCve, `Invalid ${id}.cve reached a provider request`);
    await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === ${JSON.stringify(id)}`);
    assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle');
    report.checks.push({ structuredIdentifierValidation: 'PASS', api: id, invalidField: 'cve', invalidValue: 'not-a-cve', networkRequests: 0, stateAfterBlock: 'idle' });
  }

  for (const [id, field, value] of [['uniprot-protein', 'accession', 'INVALID'], ['rcsb-pdb-entry', 'entryId', 'pdb_10004hhb']]) {
    const beforeInvalidIdentifier = b.requestCount;
    const invalidIdentifier = await executeNativeTool('run_public_api_demo', { id, parameters: { [field]: value } });
    assert.equal(invalidIdentifier.ok, false);
    await sleep(150);
    assert.equal(b.requestCount, beforeInvalidIdentifier, `Invalid ${id}.${field} reached a provider request`);
    await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === ${JSON.stringify(id)}`);
    assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle');
    report.checks.push({ structuredIdentifierValidation: 'PASS', api: id, invalidField: field, invalidValue: value, networkRequests: 0, stateAfterBlock: 'idle' });
  }

  const pdbAliasOpen = await executeNativeTool('open_public_api_demo', { id: 'rcsb-pdb-entry' });
  assert.equal(pdbAliasOpen.ok, true, pdbAliasOpen.message);
  await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === 'rcsb-pdb-entry'`);
  const pdbAliasInputPattern = await b.ev(`document.querySelector('input[name="entryId"]')?.pattern || ''`);
  assert.equal(pdbAliasInputPattern, '(?:[A-Za-z0-9]{4}|[Pp][Dd][Bb]_0000[A-Za-z0-9]{4})');
  report.checks.push({ humanIdentifierContract: 'PASS', api: 'rcsb-pdb-entry', transitionalAlias: 'pdb_0000XXXX', futureExtendedOnly: 'blocked pending verified Data API support' });

  const beforeInvalidDateInput = b.requestCount;
  const invalidDateInput = await executeNativeTool('run_public_api_demo', { id: 'aladhan-prayer-times', parameters: { date: '2026-02-30' } });
  assert.equal(invalidDateInput.ok, false);
  await sleep(150);
  assert.equal(b.requestCount, beforeInvalidDateInput, 'Invalid WebMCP date input reached a provider request');
  await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === 'aladhan-prayer-times'`);
  assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle');
  report.checks.push({ structuredDateValidation: 'PASS', api: 'aladhan-prayer-times', invalidField: 'date', networkRequests: 0, stateAfterBlock: 'idle' });

  const beforeInvalidBankDate = b.requestCount;
  const invalidBankDate = await executeNativeTool('run_public_api_demo', { id: 'bank-of-canada-valet', parameters: { startDate: '20260901' } });
  assert.equal(invalidBankDate.ok, false);
  await sleep(150);
  assert.equal(b.requestCount, beforeInvalidBankDate, 'Invalid compact Bank of Canada date reached a provider request');
  await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === 'bank-of-canada-valet'`);
  assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle');
  report.checks.push({ structuredDateValidation: 'PASS', api: 'bank-of-canada-valet', invalidField: 'startDate', invalidValue: '20260901', networkRequests: 0, stateAfterBlock: 'idle' });

  for (const [id, label] of [['open-meteo-history', 'Open-Meteo Historical Weather'], ['nasa-power-climate', 'NASA POWER Climate']]) {
    const beforeInvalidClimateDate = b.requestCount;
    const invalidClimateDate = await executeNativeTool('run_public_api_demo', { id, parameters: { startDate: '20260803' } });
    assert.equal(invalidClimateDate.ok, false);
    await sleep(150);
    assert.equal(b.requestCount, beforeInvalidClimateDate, `Invalid compact ${label} date reached a provider request`);
    await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === ${JSON.stringify(id)}`);
    assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle');
    report.checks.push({ structuredDateValidation: 'PASS', api: id, invalidField: 'startDate', invalidValue: '20260803', networkRequests: 0, stateAfterBlock: 'idle' });
  }

  for (const [id, field, invalidValue] of [['frankfurter-sgd-myr-history', 'from', '20260803'], ['mlb-stats-api', 'date', '20250415']]) {
    const beforeInvalidStrictDate = b.requestCount;
    const invalidStrictDate = await executeNativeTool('run_public_api_demo', { id, parameters: { [field]: invalidValue } });
    assert.equal(invalidStrictDate.ok, false);
    await sleep(150);
    assert.equal(b.requestCount, beforeInvalidStrictDate, `Invalid compact date reached a provider request for ${id}`);
    await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === ${JSON.stringify(id)}`);
    assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle');
    report.checks.push({ structuredDateValidation: 'PASS', api: id, invalidField: field, invalidValue, networkRequests: 0, stateAfterBlock: 'idle' });
  }

  for (const [id, parameters, invalidField] of [
    ['bank-of-canada-valet', { startDate: '2026-08-07', endDate: '2026-08-03' }, 'endDate'],
    ['open-meteo-history', { startDate: '2026-08-07', endDate: '2026-08-03' }, 'endDate'],
    ['nasa-power-climate', { startDate: '2026-08-07', endDate: '2026-08-03' }, 'endDate'],
    ['frankfurter-sgd-myr-history', { from: '2026-08-07', to: '2026-08-03' }, 'to'],
    ['open-meteo-climate', { startYear: '2030', endYear: '2020' }, 'endYear'],
    ['world-bank-indicator-explorer', { startYear: '2025', endYear: '2015' }, 'endYear'],
  ]) {
    const beforeInvalidRange = b.requestCount;
    const invalidRange = await executeNativeTool('run_public_api_demo', { id, parameters });
    assert.equal(invalidRange.ok, false);
    await sleep(150);
    assert.equal(b.requestCount, beforeInvalidRange, `Reversed range reached a provider request for ${id}`);
    await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === ${JSON.stringify(id)}`);
    assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle');
    report.checks.push({ structuredRangeValidation: 'PASS', api: id, invalidField, networkRequests: 0, stateAfterBlock: 'idle' });
  }

  const beforeInvalidClimateModel = b.requestCount;
  const invalidClimateModel = await executeNativeTool('run_public_api_demo', { id: 'open-meteo-climate', parameters: { model: 'nasa_nex_gddp' } });
  assert.equal(invalidClimateModel.ok, false);
  await sleep(150);
  assert.equal(b.requestCount, beforeInvalidClimateModel, 'Unsupported Open-Meteo Climate model reached a provider request');
  await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === 'open-meteo-climate'`);
  assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle');
  report.checks.push({ structuredSelectValidation: 'PASS', api: 'open-meteo-climate', invalidField: 'model', invalidValue: 'nasa_nex_gddp', networkRequests: 0, stateAfterBlock: 'idle' });

  const beforeInvalidAladhanMethod = b.requestCount;
  const invalidAladhanMethod = await executeNativeTool('run_public_api_demo', { id: 'aladhan-prayer-times', parameters: { method: '6' } });
  assert.equal(invalidAladhanMethod.ok, false);
  await sleep(150);
  assert.equal(b.requestCount, beforeInvalidAladhanMethod, 'Unsupported AlAdhan method reached a provider request');
  assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle');
  report.checks.push({ structuredSelectValidation: 'PASS', api: 'aladhan-prayer-times', invalidField: 'method', invalidValue: '6', networkRequests: 0, stateAfterBlock: 'idle' });

  const openGeoBoundaries = await executeNativeTool('open_public_api_demo', { id: 'geoboundaries-admin-boundaries' });
  assert.equal(openGeoBoundaries.ok, true, openGeoBoundaries.message);
  await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === 'geoboundaries-admin-boundaries'`);
  const geoInputContract = await b.ev(`(() => {
    const input = document.querySelector('input[name="countryIso"]');
    return { minLength: input?.minLength, maxLength: input?.maxLength, value: input?.value, describedBy: input?.getAttribute('aria-describedby') };
  })()`);
  assert.deepEqual(geoInputContract, { minLength: 3, maxLength: 3, value: 'SGP', describedBy: 'parameter-countryIso-help' });
  const beforeInvalidHumanInput = b.requestCount;
  await b.ev(`(() => {
    const input = document.querySelector('input[name="countryIso"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, '123');
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '123' }));
    document.querySelector('form.parameter-card').requestSubmit();
  })()`);
  await b.wait(`document.querySelector('input[name="countryIso"]')?.getAttribute('aria-invalid') === 'true'`);
  await sleep(150);
  assert.equal(b.requestCount, beforeInvalidHumanInput, 'Invalid human ISO-format input reached a provider request');
  assert.equal(await b.ev(`document.querySelector('.request-lab')?.dataset.requestState`), 'idle');
  assert.match(await b.ev(`document.querySelector('#parameter-countryIso-help')?.textContent || ''`), /exactly three letters/i);
  report.checks.push({ humanInputValidation: 'PASS', api: 'geoboundaries-admin-boundaries', field: 'countryIso', nativeMinLength: 3, nativeMaxLength: 3, nativePattern: await b.ev(`document.querySelector('input[name="countryIso"]')?.pattern || ''`), rejectedValue: '123', networkRequests: 0 });

  await b.ev(`location.hash='#/catalog'`);
  await waitForCatalog();
  await b.viewport(390, 844);
  await b.ev(`document.querySelector('button[aria-label="Open navigation"]').click()`);
  await b.wait(`document.querySelector('#primary-navigation')?.classList.contains('mobile-open')`);
  const mobileNavigation = await b.ev(`(() => {
    const nav = document.querySelector('#primary-navigation');
    const main = document.querySelector('.admin-main');
    const detail = document.querySelector('.detail-panel');
    const scrim = document.querySelector('.nav-scrim');
    const close = document.querySelector('button[aria-label="Close navigation menu"]');
    return {
      role: nav?.getAttribute('role'),
      modal: nav?.getAttribute('aria-modal'),
      mainInert: main?.hasAttribute('inert'),
      detailInert: detail?.hasAttribute('inert'),
      activeClose: document.activeElement === close,
      scrimAriaHidden: scrim?.getAttribute('aria-hidden'),
      scrimTabIndex: scrim?.tabIndex,
    };
  })()`);
  assert.deepEqual(mobileNavigation, { role: 'dialog', modal: 'true', mainInert: true, detailInert: true, activeClose: true, scrimAriaHidden: 'true', scrimTabIndex: -1 });
  await b.ev(`(() => {
    const last = [...document.querySelectorAll('#primary-navigation nav button')].at(-1);
    last.focus();
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
  })()`);
  assert.equal(await b.ev(`document.activeElement?.getAttribute('aria-label')`), 'Close navigation from API Console brand');
  await b.ev(`(() => {
    const first = document.querySelector('button[aria-label="Close navigation from API Console brand"]');
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
  })()`);
  assert.equal(await b.ev(`document.activeElement?.textContent?.trim()`), 'Documentation');
  await b.ev(`document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))`);
  await b.wait(`!document.querySelector('#primary-navigation')?.classList.contains('mobile-open')`);
  assert.equal(await b.ev(`document.activeElement?.getAttribute('aria-label')`), 'Open navigation');
  assert.equal(await b.ev(`document.querySelector('.admin-main')?.hasAttribute('inert')`), false);
  report.checks.push({ mobileNavigation: 'PASS', modal: true, backgroundInert: true, focusContained: true, escapeRestoresOpener: true });

  await b.viewport(900, 844);
  await setCatalogSearch('please show me how to convert currency');
  await b.wait(`document.querySelectorAll('tbody tr[data-api-id]').length === 1 && document.querySelector('tr[data-api-id="exchange-rate-current"]')`);
  report.checks.push({ humanTaskSearch: 'PASS', query: 'please show me how to convert currency', matchedApi: 'exchange-rate-current' });
  await setCatalogSearch('');

  await setCatalogSearch('Live Weather');
  await b.wait(`document.querySelector('tr[data-api-id="weather"] input[type="radio"]')`);
  await b.ev(`(() => {
    const trigger = document.querySelector('tr[data-api-id="weather"] input[type="radio"]');
    trigger.focus();
    trigger.click();
  })()`);
  await b.wait(`document.querySelector('.detail-panel')?.getAttribute('role') === 'dialog'`);
  const compactDetail = await b.ev(`(() => {
    const panel = document.querySelector('.detail-panel');
    const main = document.querySelector('.admin-main');
    const nav = document.querySelector('#primary-navigation');
    const close = document.querySelector('button[aria-label="Close selected API details"]');
    const scrim = document.querySelector('.detail-scrim');
    return {
      name: panel?.getAttribute('aria-label'),
      modal: panel?.getAttribute('aria-modal'),
      mainInert: main?.hasAttribute('inert'),
      navInert: nav?.hasAttribute('inert'),
      activeClose: document.activeElement === close,
      scrimAriaHidden: scrim?.getAttribute('aria-hidden'),
    };
  })()`);
  assert.deepEqual(compactDetail, { name: 'Live Weather details', modal: 'true', mainInert: true, navInert: true, activeClose: true, scrimAriaHidden: 'true' });
  await b.ev(`(() => {
    const panel = document.querySelector('.detail-panel');
    const items = [...panel.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
    const last = items.at(-1);
    last.focus();
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
  })()`);
  assert.equal(await b.ev(`document.activeElement?.getAttribute('aria-label')`), 'Close selected API details');
  await b.ev(`(() => {
    const close = document.querySelector('button[aria-label="Close selected API details"]');
    close.focus();
    close.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
  })()`);
  assert.equal(await b.ev(`/Copy fetch/i.test(document.activeElement?.textContent || '')`), true);
  await b.ev(`document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))`);
  await b.wait(`document.querySelector('.detail-panel')?.getAttribute('role') !== 'dialog'`);
  assert.equal(await b.ev(`document.activeElement?.getAttribute('aria-label')`), 'Select Live Weather');
  assert.equal(await b.ev(`document.querySelector('.admin-main')?.hasAttribute('inert')`), false);
  report.checks.push({ compactDetailDrawer: 'PASS', viewport: '900x844', modal: true, backgroundInert: true, focusContained: true, escapeRestoresInvoker: true });

  await b.viewport(1440, 1000);
  await setCatalogSearch('');
  await waitForCatalog();
  assert.equal(await b.ev(`Boolean(document.querySelector('button[aria-label="Close selected API details"]'))`), false, 'Desktop sticky details exposed a no-op close button');

  await setCatalogSearch('Nominatim');
  await b.wait(`document.querySelector('tr[data-api-id="nominatim-search"] input[type="radio"]')`);
  const beforeCatalogQuickAction = b.requestCount;
  await b.ev(`document.querySelector('tr[data-api-id="nominatim-search"] input[type="radio"]').click()`);
  await b.wait(`document.querySelector('.detail-panel .detail-title h2')?.textContent === 'OpenStreetMap Nominatim'`);
  const quickAction = await b.ev(`(() => {
    const button = document.querySelector('.detail-actions .primary-action');
    return { text: button?.innerText, policy: button?.dataset.agentExecution };
  })()`);
  assert.match(quickAction.text, /Open interactive Request Lab/i);
  assert.equal(quickAction.policy, 'manual-only');
  assert.equal(await b.ev(`Boolean([...document.querySelectorAll('.detail-actions button')].find(button => /Copy fetch/i.test(button.textContent || '')))`), false);
  await b.ev(`document.querySelector('.detail-actions .primary-action').click()`);
  await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === 'nominatim-search'`);
  await b.wait(`document.activeElement === document.querySelector('.topbar h1')`);
  assert.equal(await b.ev(`document.activeElement?.textContent`), 'Request Lab');
  await sleep(150);
  assert.equal(b.requestCount, beforeCatalogQuickAction, 'Manual-only catalog quick action auto-ran Nominatim');
  assert.equal(await b.ev(`document.querySelector('.request-lab').dataset.requestState`), 'idle');
  report.checks.push({ catalogQuickAction: 'PASS', api: 'nominatim-search', behavior: 'navigate-only', networkRequests: 0 });

  const openLanguageToolInitial = await executeNativeTool('open_public_api_demo', { id: 'languagetool-grammar-check' });
  assert.equal(openLanguageToolInitial.ok, true, openLanguageToolInitial.message);
  await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === 'languagetool-grammar-check'`);
  const manualUi = await b.ev(`(() => {
    const lab = document.querySelector('.request-lab');
    const form = document.querySelector('.parameter-card');
    const button = form.querySelector('button[type="submit"]');
    const note = document.querySelector('.agent-policy-note');
    return {
      labPolicy: lab.dataset.agentExecution,
      formPolicy: form.dataset.agentExecution,
      buttonPolicy: button.dataset.agentExecution,
      describedBy: button.getAttribute('aria-describedby'),
      noteId: note?.id,
      noteLabel: note?.getAttribute('aria-label'),
      noteText: note?.innerText,
      requestState: lab.dataset.requestState,
    };
  })()`);
  assert.equal(manualUi.labPolicy, 'manual-only');
  assert.equal(manualUi.formPolicy, 'manual-only');
  assert.equal(manualUi.buttonPolicy, 'manual-only');
  assert.equal(manualUi.describedBy, manualUi.noteId);
  assert.equal(manualUi.noteLabel, 'Agent execution restriction');
  assert.match(manualUi.noteText, /Interactive use only/i);
  assert.match(manualUi.noteText, /prohibits automated requests/i);
  assert.equal(manualUi.requestState, 'idle');
  assert.equal(await b.ev(`Boolean(document.querySelector('[data-output-tab="code"]'))`), false, 'Manual-only provider exposed generic fetch code');

  const beforeBlockedRun = b.requestCount;
  const blocked = await executeNativeTool('run_public_api_demo', { id: 'languagetool-grammar-check' });
  assert.equal(blocked.ok, false);
  assert.match(blocked.message, /failed/i);
  await sleep(150);
  assert.equal(b.requestCount, beforeBlockedRun, 'Blocked WebMCP execution sent a network request');
  assert(!b.blockedProviders.some((url) => url.includes('api.languagetool.org')), 'LanguageTool request reached the browser interception boundary');
  assert.equal(await b.ev(`document.querySelector('.request-lab').dataset.requestState`), 'idle');
  report.checks.push({ structuredAgentBlock: 'PASS', api: 'languagetool-grammar-check', networkRequests: 0, stateAfterBlock: 'idle' });

  const openNominatim = await executeNativeTool('open_public_api_demo', { id: 'nominatim-search' });
  assert.equal(openNominatim.ok, true, openNominatim.message);
  await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === 'nominatim-search'`);
  const nominatimUi = await b.ev(`(() => {
    const lab = document.querySelector('.request-lab');
    const form = document.querySelector('.parameter-card');
    const note = document.querySelector('.agent-policy-note');
    return {
      labPolicy: lab.dataset.agentExecution,
      formPolicy: form.dataset.agentExecution,
      noteText: note?.innerText,
      policyHref: note?.querySelector('a')?.href,
      requestState: lab.dataset.requestState,
    };
  })()`);
  assert.equal(nominatimUi.labPolicy, 'manual-only');
  assert.equal(nominatimUi.formPolicy, 'manual-only');
  assert.match(nominatimUi.noteText, /generic platform integration/i);
  assert.equal(nominatimUi.policyHref, 'https://operations.osmfoundation.org/policies/nominatim/');
  assert.equal(nominatimUi.requestState, 'idle');
  const beforeNominatimBlock = b.requestCount;
  const nominatimBlocked = await executeNativeTool('run_public_api_demo', { id: 'nominatim-search' });
  assert.equal(nominatimBlocked.ok, false);
  assert.match(nominatimBlocked.message, /failed/i);
  await sleep(150);
  assert.equal(b.requestCount, beforeNominatimBlock, 'Blocked Nominatim WebMCP execution sent a network request');
  assert.equal(await b.ev(`document.querySelector('.request-lab').dataset.requestState`), 'idle');
  report.checks.push({ structuredAgentBlock: 'PASS', api: 'nominatim-search', networkRequests: 0, stateAfterBlock: 'idle' });

  const openLanguageTool = await executeNativeTool('open_public_api_demo', { id: 'languagetool-grammar-check' });
  assert.equal(openLanguageTool.ok, true, openLanguageTool.message);
  await b.wait(`document.querySelector('.parameter-card')?.dataset.apiId === 'languagetool-grammar-check'`);
  await b.viewport(390, 844);
  const mobile = await b.ev(`(() => {
    const note = document.querySelector('.agent-policy-note');
    const form = document.querySelector('.parameter-card');
    return {
      documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      formOverflow: form.scrollWidth > form.clientWidth + 1,
      noteOverflow: note.scrollWidth > note.clientWidth + 1,
      noteWidth: Math.round(note.getBoundingClientRect().width),
    };
  })()`);
  assert.equal(mobile.documentOverflow || mobile.formOverflow || mobile.noteOverflow, false, JSON.stringify(mobile));
  await b.screenshot(`${evidence}/provider-policy-languagetool-390.png`);
  report.checks.push({ mobilePolicyNote: 'PASS', ...mobile });

  await b.viewport(1440, 1000);
  const permitted = await executeNativeTool('run_public_api_demo', { id: 'color-api' });
  assert.equal(permitted.ok, true, permitted.message);
  await b.wait(`document.querySelector('.demo-preview')?.dataset.apiId === 'color-api'`);
  const permittedUi = await b.ev(`(() => {
    const lab = document.querySelector('.request-lab');
    const preview = document.querySelector('.demo-preview');
    return {
      state: lab.dataset.requestState,
      policy: lab.dataset.agentExecution,
      design: preview.dataset.ssotDesign,
      layout: preview.dataset.previewLayout,
      fallback: preview.dataset.ssotFallback,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  })()`);
  assert.deepEqual(permittedUi, {
    state: 'success', policy: 'enabled', design: 'result-card-v2', layout: 'color-swatch', fallback: 'false', overflow: false,
  });
  const colorFixtureRequests = b.fixtureRequests.filter((request) => request.url === colorFixtureUrl && request.method === 'GET');
  assert.equal(colorFixtureRequests.length, 1, JSON.stringify(colorFixtureRequests));
  report.checks.push({ permittedAgentExecution: 'PASS', api: 'color-api', source: 'synthetic-fixture', liveProviderRequests: 0, fixtureRequests: colorFixtureRequests.length, ...permittedUi });

  const ax = await b.call('Accessibility.getFullAXTree');
  const active = ax.nodes.filter((node) => !node.ignored);
  const unnamed = active.filter((node) => ['button', 'combobox', 'textbox', 'link'].includes(node.role?.value) && !(node.name?.value || '').trim());
  assert.equal(unnamed.length, 0, JSON.stringify(unnamed));
  report.checks.push({ accessibilityTree: 'PASS', unnamedControls: 0 });

  assert.deepEqual(b.errors, []);
  report.verdict = 'PASS';
} catch (error) {
  report.verdict = 'FAIL';
  report.error = String(error);
  console.error(error);
} finally {
  report.errors.push(...b.errors);
  await b.close();
  fs.writeFileSync(`${evidence}/provider-policy-verification.json`, JSON.stringify(report, null, 2));
}

console.log(JSON.stringify({ verdict: report.verdict, error: report.error, checks: report.checks }, null, 2));
process.exit(report.verdict === 'PASS' ? 0 : 1);
