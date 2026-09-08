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
    expect(randomUser?.parameters.find((field) => field.id === 'count')).toMatchObject({ min: 1, max: 10 })
    expect(randomUser?.parameters.find((field) => field.id === 'nationality')?.options).toContainEqual({ label: 'Australia', value: 'au' })
    expect(geoBoundaries?.parameters.find((field) => field.id === 'countryIso')).toMatchObject({ minLength: 3, maxLength: 3 })
  })
})
