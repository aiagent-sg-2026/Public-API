import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'open-meteo-elevation')
if (!api) throw new Error('Missing open-meteo-elevation fixture')

describe('Open-Meteo Elevation semantic preview', () => {
  afterEach(cleanup)

  it('keeps the request coordinate beside the response elevation', () => {
    render(<ResponseDemoPreview
      api={api}
      data={{ elevation: [46] }}
      requestUrl="https://api.open-meteo.com/v1/elevation?latitude=1.3521&longitude=103.8198&format=json"
    />)

    const preview = screen.getByRole('region', { name: 'Open-Meteo Elevation' })
    expect(preview).toHaveAttribute('data-preview-layout', 'terrain-elevation')
    expect(preview).toHaveAttribute('data-ssot-fallback', 'false')

    const card = preview.querySelector('.elevation-preview')
    expect(card).toHaveAttribute('data-primary-elevation-meters', '46')
    expect(card).toHaveAttribute('data-request-latitude', '1.3521')
    expect(card).toHaveAttribute('data-request-longitude', '103.8198')
    expect(card).toHaveAttribute('data-dem-resolution-meters', '90')
    expect(card).toHaveAttribute('data-source-dataset', 'Copernicus DEM 2021 GLO-90')
    expect(within(preview).getByRole('heading', { name: '46 m terrain elevation' })).toBeInTheDocument()
    expect(preview).toHaveTextContent('WGS84 1.3521, 103.8198')
    expect(preview).toHaveTextContent('Requested latitude1.3521')
    expect(preview).toHaveTextContent('Requested longitude103.8198')
    expect(preview).toHaveTextContent('Copernicus DEM 2021 GLO-90')
    expect(preview).toHaveTextContent('requires attribution to both the Copernicus programme and Open-Meteo')
    expect(preview).not.toHaveTextContent('Point 1')
    expect(preview.querySelector('.semantic-card-grid')).not.toBeInTheDocument()
  })

  it('fails semantically closed when the provider omits a numeric elevation', () => {
    render(<ResponseDemoPreview api={api} data={{ elevation: [] }}/>)

    const preview = screen.getByRole('region', { name: 'Open-Meteo Elevation' })
    const empty = preview.querySelector('[data-domain-card="terrain-elevation"]')
    expect(empty).toHaveAttribute('data-result-state', 'empty')
    expect(preview).toHaveTextContent('Terrain elevation unavailable')
  })
})
