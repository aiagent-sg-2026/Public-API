import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'uk-flood-monitoring')
if (!api) throw new Error('Missing uk-flood-monitoring fixture')

const station = {
  label: 'Worcester (Barbourne)',
  riverName: 'River Severn',
  stationReference: '2642',
  status: 'http://environment.data.gov.uk/flood-monitoring/def/core/statusActive',
  town: 'Worcester',
  catchmentName: 'Worcestershire Middle Severn',
  lat: 52.206967,
  long: -2.235272,
  measures: [{
    '@id': 'http://environment.data.gov.uk/flood-monitoring/id/measures/2642-level-stage-i-15_min-mASD',
    parameter: 'level',
    parameterName: 'Water Level',
    period: 900,
    qualifier: 'Stage',
    unitName: 'mASD',
  }],
}

describe('UK flood monitoring station semantic preview', () => {
  afterEach(cleanup)

  it('preserves station identity, location, status, and available measure semantics', () => {
    render(<ResponseDemoPreview
      api={api}
      data={{ items: [station] }}
      requestUrl="https://environment.data.gov.uk/flood-monitoring/id/stations?riverName=River+Severn&_limit=8"
    />)

    const preview = screen.getByRole('region', { name: 'UK Flood Monitoring' })
    expect(preview).toHaveAttribute('data-preview-layout', 'flood-stations')
    expect(preview).toHaveAttribute('data-ssot-fallback', 'false')
    const card = preview.querySelector('.flood-stations-preview')
    expect(card).toHaveAttribute('data-requested-river', 'River Severn')
    expect(card).toHaveAttribute('data-station-count', '1')
    expect(card).toHaveAttribute('data-primary-station-reference', '2642')

    const stationItem = preview.querySelector('[data-station-reference="2642"]')
    expect(stationItem).toHaveAttribute('data-river-name', 'River Severn')
    expect(stationItem).toHaveAttribute('data-station-status', 'Active')
    expect(stationItem).toHaveAttribute('data-measure-count', '1')
    expect(within(preview).getByRole('heading', { name: 'Worcester (Barbourne)' })).toBeInTheDocument()
    expect(preview).toHaveTextContent('Worcestershire Middle Severn')
    expect(preview).toHaveTextContent('52.206967, -2.235272')
    expect(preview).toHaveTextContent('Water Level · Stage · mASD · 900 s interval')
    expect(preview).toHaveTextContent('Live readings and flood warnings are separate API resources')
  })

  it('states that riverName is an exact provider filter when no stations are returned', () => {
    render(<ResponseDemoPreview
      api={api}
      data={{ items: [] }}
      requestUrl="https://environment.data.gov.uk/flood-monitoring/id/stations?riverName=Thames&_limit=8"
    />)
    const preview = screen.getByRole('region', { name: 'UK Flood Monitoring' })
    expect(preview.querySelector('[data-domain-card="flood-stations"]')).toHaveAttribute('data-result-state', 'empty')
    expect(preview).toHaveTextContent('exact river-name filter “Thames”')
  })
})
