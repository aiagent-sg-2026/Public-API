import { describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { buildMachineCatalog } from './machineCatalog'

describe('machine-readable API catalog', () => {
  it('exports the catalog from the API SSOT without live-health claims', () => {
    const catalog = buildMachineCatalog(apiCatalog, '/Public-API/')
    expect(catalog.schemaVersion).toBe(1)
    expect(catalog.catalogCount).toBe(195)
    expect(catalog.catalogPath).toBe('/Public-API/')
    expect(catalog.requestLabPattern).toBe('/Public-API/#/request-lab?api={api-id}')
    expect(catalog.health).toBe('not-included')
    expect(catalog.automatedVerificationDefault).toEqual({ mode: 'enabled' })
    expect(catalog.apis).toHaveLength(apiCatalog.length)
    expect(new Set(catalog.apis.map((api) => api.id)).size).toBe(apiCatalog.length)
    expect(JSON.stringify(catalog)).not.toContain('buildUrl')
    expect(JSON.stringify(catalog)).not.toContain('lastReviewed')
    expect(JSON.stringify(catalog)).not.toContain('healthy')
  })

  it('carries provider execution policy and deterministic Request Lab paths', () => {
    const catalog = buildMachineCatalog(apiCatalog, 'Public-API')
    const languageTool = catalog.apis.find((api) => api.id === 'languagetool-grammar-check')
    const nominatim = catalog.apis.find((api) => api.id === 'nominatim-search')
    const color = catalog.apis.find((api) => api.id === 'color-api')
    const celestrak = catalog.apis.find((api) => api.id === 'celestrak-satellites')
    const exchangeRates = catalog.apis.find((api) => api.id === 'exchange-rate-current')

    expect(languageTool).toMatchObject({
      method: 'POST',
      keyRequired: false,
      requestLabUrl: '/Public-API/#/request-lab?api=languagetool-grammar-check',
      agentExecution: {
        mode: 'manual-only',
        policyUrl: 'https://dev.languagetool.org/public-http-api.html',
      },
    })
    expect(nominatim?.agentExecution).toMatchObject({
      mode: 'manual-only',
      policyUrl: 'https://operations.osmfoundation.org/policies/nominatim/',
    })
    expect(color?.agentExecution).toEqual({ mode: 'enabled' })
    expect(color?.automatedVerification).toBeUndefined()
    expect(celestrak?.automatedVerification).toMatchObject({
      mode: 'cadence-limited',
      minimumIntervalSeconds: 7200,
      retryOnNon2xx: false,
      policyUrl: 'https://celestrak.org/usage-policy.php',
    })
    expect(exchangeRates?.keywords).toContain('currency conversion')
    expect(catalog.apis.some((api) => api.id === 'musicbrainz-artist-search')).toBe(false)
    expect(catalog.apis.some((api) => api.id === 'yahoo-finance-sgx-history')).toBe(false)
    expect(catalog.apis.some((api) => api.id === 'gutendex-books')).toBe(false)
    expect(catalog.apis.some((api) => api.id === 'crates-io-search')).toBe(false)
    expect(catalog.apis.some((api) => api.id === 'nws-weather')).toBe(false)
  })

  it('exports parameter bounds and select options without executable request functions', () => {
    const catalog = buildMachineCatalog(apiCatalog, '/')
    const randomUser = catalog.apis.find((api) => api.id === 'people')
    const geoBoundaries = catalog.apis.find((api) => api.id === 'geoboundaries-admin-boundaries')
    const aladhan = catalog.apis.find((api) => api.id === 'aladhan-prayer-times')
    const brasil = catalog.apis.find((api) => api.id === 'brasilapi-postcode')
    const uniprot = catalog.apis.find((api) => api.id === 'uniprot-protein')
    const pdb = catalog.apis.find((api) => api.id === 'rcsb-pdb-entry')
    const firstEpss = catalog.apis.find((api) => api.id === 'first-epss')
    const circl = catalog.apis.find((api) => api.id === 'circl-vulnerability')
    const unhcr = catalog.apis.find((api) => api.id === 'unhcr-refugees')
    const apple = catalog.apis.find((api) => api.id === 'apple-itunes-search')
    const zippopotam = catalog.apis.find((api) => api.id === 'zippopotam-postcode')
    const openMeteoClimate = catalog.apis.find((api) => api.id === 'open-meteo-climate')
    const openMeteoHistory = catalog.apis.find((api) => api.id === 'open-meteo-history')
    const worldBankIndicator = catalog.apis.find((api) => api.id === 'world-bank-indicator-explorer')
    expect(randomUser?.parameters.find((field) => field.id === 'count')).toMatchObject({ min: 1, max: 10 })
    expect(randomUser?.parameters.find((field) => field.id === 'nationality')?.options).toContainEqual({ label: 'Australia', value: 'au' })
    expect(geoBoundaries?.parameters.find((field) => field.id === 'countryIso')).toMatchObject({
      minLength: 3, maxLength: 3, pattern: '[A-Za-z]{3}',
      patternDescription: 'must contain exactly three letters (an ISO 3166-1 alpha-3 code or the special ALL code).',
    })
    expect(aladhan?.parameters.find((field) => field.id === 'method')).toMatchObject({ type: 'select', defaultValue: '11' })
    expect(aladhan?.parameters.find((field) => field.id === 'method')?.options?.map((option) => option.value)).toContain('0')
    expect(aladhan?.parameters.find((field) => field.id === 'method')?.options?.map((option) => option.value)).not.toContain('99')
    expect(brasil?.parameters.find((field) => field.id === 'postcode')).toMatchObject({ pattern: '\\d{5}-?\\d{3}', patternDescription: 'must contain exactly eight digits, optionally formatted as 12345-678.' })
    expect(catalog.apis.find((api) => api.id === 'color-api')?.parameters.find((field) => field.id === 'hex')).toMatchObject({
      pattern: '#?(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})',
      patternDescription: 'must be a 3- or 6-digit hexadecimal color, with an optional leading #.',
    })
    expect(uniprot?.parameters.find((field) => field.id === 'accession')).toMatchObject({
      pattern: '[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9](?:[A-Z][A-Z0-9]{2}[0-9]){1,2}',
      patternDescription: 'must be a valid 6- or 10-character UniProtKB accession.',
    })
    expect(pdb?.parameters.find((field) => field.id === 'entryId')).toMatchObject({
      minLength: 4,
      maxLength: 12,
      pattern: '(?:[A-Za-z0-9]{4}|[Pp][Dd][Bb]_0000[A-Za-z0-9]{4})',
      patternDescription: 'must be a four-character PDB ID or a transitional pdb_0000XXXX extended alias for an entry that still has a legacy ID.',
    })
    for (const api of [firstEpss, circl]) {
      expect(api?.parameters.find((field) => field.id === 'cve')).toMatchObject({
        pattern: 'CVE-[0-9]{4}-[0-9]{4,}',
        patternDescription: 'must use the CVE-YYYY-NNNN format with four or more sequence digits.',
      })
    }
    expect(unhcr?.parameters.find((field) => field.id === 'origin')).toMatchObject({
      minLength: 3, maxLength: 3, pattern: '[A-Za-z]{3}',
      patternDescription: 'must contain exactly three letters for an ISO 3166-1 alpha-3 country code.',
    })
    for (const api of [apple, zippopotam]) {
      expect(api?.parameters.find((field) => field.id === 'country')).toMatchObject({
        minLength: 2, maxLength: 2, pattern: '[A-Za-z]{2}',
        patternDescription: 'must contain exactly two letters for an ISO 3166-1 alpha-2 country code.',
      })
    }
    expect(apple?.parameters.map((field) => field.id)).toEqual(['query', 'entity', 'country', 'limit'])
    expect(apple?.parameters.find((field) => field.id === 'entity')).toMatchObject({ type: 'select', defaultValue: 'song' })
    expect(apple?.parameters.find((field) => field.id === 'entity')?.options?.map((option) => option.value)).toEqual([
      'song', 'musicTrack', 'album', 'musicArtist', 'musicVideo', 'mix', 'podcast', 'podcastAuthor',
    ])
    expect(openMeteoClimate?.parameters.find((field) => field.id === 'model')).toMatchObject({ type: 'select', defaultValue: 'CMCC_CM2_VHR4' })
    expect(openMeteoClimate?.parameters.find((field) => field.id === 'model')?.options?.map((option) => option.value)).toEqual([
      'CMCC_CM2_VHR4', 'FGOALS_f3_H', 'HiRAM_SIT_HR', 'MRI_AGCM3_2_S', 'EC_Earth3P_HR', 'MPI_ESM1_2_XR', 'NICAM16_8S',
    ])
    expect(openMeteoHistory?.parameters.find((field) => field.id === 'endDate')).toMatchObject({ minimumFromField: 'startDate' })
    expect(openMeteoClimate?.parameters.find((field) => field.id === 'endYear')).toMatchObject({ minimumFromField: 'startYear' })
    expect(worldBankIndicator?.parameters.find((field) => field.id === 'endYear')).toMatchObject({ minimumFromField: 'startYear' })
  })
})
