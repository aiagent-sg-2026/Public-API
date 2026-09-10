import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'usgs-water-legacy')
if (!api) throw new Error('Missing usgs-water-legacy fixture')

describe('USGS Water Data V1 semantic preview', () => {
  afterEach(cleanup)

  it('preserves the selected measurement, observation status, time and coordinates', () => {
    render(<ResponseDemoPreview api={api} data={{
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          time_series_id: 'series-1',
          monitoring_location_id: 'USGS-01646500',
          parameter_code: '00060',
          statistic_id: '00011',
          time: '2026-09-08T02:50:00+00:00',
          value: '1940',
          unit_of_measure: 'ft^3/s',
          approval_status: 'Provisional',
          qualifier: null,
        },
        geometry: { type: 'Point', coordinates: [-77.1276388889, 38.9497777778] },
      }],
    }}/>)

    const preview = screen.getByRole('region', { name: 'USGS Water Data V1' })
    expect(preview).toHaveAttribute('data-preview-layout', 'water-gauge')
    expect(preview).toHaveAttribute('data-ssot-fallback', 'false')
    const card = preview.querySelector('.usgs-water-preview')
    expect(card).toHaveAttribute('data-monitoring-location-id', 'USGS-01646500')
    expect(card).toHaveAttribute('data-parameter-code', '00060')
    expect(card).toHaveAttribute('data-primary-value', '1940')
    expect(card).toHaveAttribute('data-unit-of-measure', 'ft^3/s')
    expect(card).toHaveAttribute('data-approval-status', 'Provisional')
    expect(within(preview).getByRole('heading', { name: '1,940 ft^3/s streamflow / discharge' })).toBeInTheDocument()
    expect(preview).toHaveTextContent('Streamflow / discharge (00060)')
    expect(preview).toHaveTextContent('2026-09-08T02:50:00+00:00')
    expect(preview).toHaveTextContent('Provisional')
    expect(preview).toHaveTextContent('38.9497777778, -77.1276388889')
  })

  it('fails semantically closed when no matching latest observation is returned', () => {
    render(<ResponseDemoPreview api={api} data={{ type: 'FeatureCollection', features: [] }}/>)
    const preview = screen.getByRole('region', { name: 'USGS Water Data V1' })
    expect(preview.querySelector('[data-domain-card="water-gauge"]')).toHaveAttribute('data-result-state', 'empty')
    expect(preview).toHaveTextContent('USGS continuous observation unavailable')
  })
})
