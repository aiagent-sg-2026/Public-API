import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'carbon-intensity-gb')
if (!api) throw new Error('Missing carbon-intensity-gb fixture')

describe('Carbon Intensity GB semantic preview', () => {
  afterEach(cleanup)

  it('preserves forecast, estimated actual, index, and the full UTC half-hour interval', () => {
    render(<ResponseDemoPreview api={api} data={{
      data: [{
        from: '2026-09-08T02:30Z',
        to: '2026-09-08T03:00Z',
        intensity: { forecast: 78, actual: 76, index: 'low' },
      }],
    }}/>)

    const preview = screen.getByRole('region', { name: 'Carbon Intensity GB' })
    expect(preview).toHaveAttribute('data-preview-layout', 'carbon-intensity')
    expect(preview).toHaveAttribute('data-ssot-fallback', 'false')

    const card = preview.querySelector('.carbon-intensity-preview')
    expect(card).toHaveAttribute('data-primary-intensity-gco2-kwh', '76')
    expect(card).toHaveAttribute('data-primary-index', 'low')
    expect(card).toHaveAttribute('data-forecast-gco2-kwh', '78')
    expect(card).toHaveAttribute('data-actual-gco2-kwh', '76')
    expect(card).toHaveAttribute('data-period-from', '2026-09-08T02:30Z')
    expect(card).toHaveAttribute('data-period-to', '2026-09-08T03:00Z')
    expect(within(preview).getByRole('heading', { name: 'Low carbon intensity' })).toBeInTheDocument()
    expect(preview).toHaveTextContent('Estimated actual76 gCO₂/kWh')
    expect(preview).toHaveTextContent('Forecast78 gCO₂/kWh')
    expect(preview).toHaveTextContent('2026-09-08T02:30Z')
    expect(preview).toHaveTextContent('2026-09-08T03:00Z')
    expect(preview).not.toHaveTextContent('GB carbon intensity')
    expect(preview.querySelector('.semantic-card-grid')).not.toBeInTheDocument()
  })

  it('keeps a forecast usable when the provider has not supplied an estimated actual yet', () => {
    render(<ResponseDemoPreview api={api} data={{
      data: [{
        from: '2026-09-08T03:00Z',
        to: '2026-09-08T03:30Z',
        intensity: { forecast: 81, actual: null, index: 'moderate' },
      }],
    }}/>)

    const preview = screen.getByRole('region', { name: 'Carbon Intensity GB' })
    const card = preview.querySelector('.carbon-intensity-preview')
    expect(card).toHaveAttribute('data-primary-intensity-gco2-kwh', '81')
    expect(card).toHaveAttribute('data-forecast-gco2-kwh', '81')
    expect(card).not.toHaveAttribute('data-actual-gco2-kwh')
    expect(preview).toHaveTextContent('Estimated actualNot supplied')
    expect(preview).toHaveTextContent('Forecast81 gCO₂/kWh')
  })

  it('fails semantically closed when no intensity record is present', () => {
    render(<ResponseDemoPreview api={api} data={{ data: [] }}/>)

    const preview = screen.getByRole('region', { name: 'Carbon Intensity GB' })
    const empty = preview.querySelector('[data-domain-card="carbon-intensity"]')
    expect(empty).toHaveAttribute('data-result-state', 'empty')
    expect(preview).toHaveTextContent('Carbon intensity unavailable')
  })
})
