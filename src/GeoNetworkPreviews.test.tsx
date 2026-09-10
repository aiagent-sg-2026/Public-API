import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const byId = (id: string) => {
  const api = apiCatalog.find((candidate) => candidate.id === id)
  if (!api) throw new Error(`Missing ${id} fixture`)
  return api
}

describe('network and administrative-boundary semantic previews', () => {
  afterEach(cleanup)

  it('keeps IP geolocation explicitly approximate while preserving network identity', () => {
    render(<ResponseDemoPreview api={byId('ipwhois-lookup')} data={{
      ip: '8.8.8.8', success: true, type: 'IPv4', continent: 'North America', country: 'United States', country_code: 'US', region: 'California', region_code: 'CA', city: 'San Jose', latitude: 37.3393939, longitude: -121.8949553, is_eu: false, postal: '95025',
      connection: { asn: 15169, org: 'Google LLC', isp: 'Google LLC', domain: 'google.com' }, timezone: { id: 'America/Los_Angeles', is_dst: true, utc: '-07:00' },
    }}/>)
    const preview = screen.getByRole('region', { name: 'IPWhoIs Geolocation' })
    expect(preview).toHaveAttribute('data-preview-layout', 'ip-geolocation')
    const card = preview.querySelector('.ipwhois-preview')
    expect(card).toHaveAttribute('data-primary-ip', '8.8.8.8')
    expect(card).toHaveAttribute('data-country-code', 'US')
    expect(card).toHaveAttribute('data-asn', '15169')
    expect(card).toHaveAttribute('data-geolocation-basis', 'approximate-network-derived')
    expect(preview).toHaveTextContent('Coordinates · WGS84 approximate37.3393939, -121.8949553')
    expect(preview).toHaveTextContent('ASNAS15,169')
    expect(preview).toHaveTextContent('not device GPS or a precise personal address')
    expect(preview).toHaveTextContent('1,000 requests per day')
    expect(preview).not.toHaveTextContent('IPWhoIs Geolocation record 1')
  })

  it('turns HTTP-success application errors into an invalid semantic result', () => {
    render(<ResponseDemoPreview api={byId('ipwhois-lookup')} data={{ ip: '127.0.0.1', success: false, message: 'Reserved range' }}/>)
    const preview = screen.getByRole('region', { name: 'IPWhoIs Geolocation' })
    expect(preview.querySelector('[data-domain-card="ip-geolocation"]')).toHaveAttribute('data-result-state', 'invalid')
    expect(preview).toHaveTextContent('Reserved range')
    expect(screen.getByRole('status')).toHaveTextContent('Live response received for IPWhoIs Geolocation.')
    expect(screen.getByRole('status')).not.toHaveTextContent(/result ready/i)
  })

  it('labels geoBoundaries statistics as per-unit means and exposes actual geometry download links', () => {
    render(<ResponseDemoPreview api={byId('geoboundaries-admin-boundaries')} data={{
      boundaryID: 'SGP-ADM1-49756563', boundaryName: 'Singapore', boundaryISO: 'SGP', boundaryYearRepresented: '2016', boundaryType: 'ADM1', boundarySource: 'Urban Redevelopment Authority, derived from ADM 3', boundaryLicense: 'Open Data Commons Open Database License 1.0', licenseDetail: 'Source terms apply', sourceDataUpdateDate: 'Thu Jan 19 07:31:04 2023', buildDate: 'Dec 12, 2023', 'UNSDG-region': 'Eastern and South-Eastern Asia', worldBankIncomeGroup: 'High-income Countries', admUnitCount: '5', meanPerimeterLengthKM: '129.07720449026624', meanAreaSqKM: '156.38829290818552', gjDownloadURL: 'https://example.test/full.geojson', simplifiedGeometryGeoJSON: 'https://example.test/simple.geojson', tjDownloadURL: 'https://example.test/full.topojson', staticDownloadLink: 'https://example.test/archive.zip',
    }}/>)
    const preview = screen.getByRole('region', { name: 'geoBoundaries Admin Boundaries' })
    expect(preview).toHaveAttribute('data-preview-layout', 'boundary-layer')
    const card = preview.querySelector('.geoboundaries-preview')
    expect(card).toHaveAttribute('data-boundary-id', 'SGP-ADM1-49756563')
    expect(card).toHaveAttribute('data-admin-unit-count', '5')
    expect(card).toHaveAttribute('data-mean-unit-area-sq-km', '156.38829290818552')
    expect(preview).toHaveTextContent('Mean administrative-unit area156.388292908 km²')
    expect(preview).toHaveTextContent('not total country area or perimeter')
    expect(screen.getByRole('link', { name: 'Full GeoJSON for Singapore ADM1' })).toHaveAttribute('href', 'https://example.test/full.geojson')
    expect(preview).not.toHaveTextContent('geoBoundaries Admin Boundaries record 1')
  })
})
