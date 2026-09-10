import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'hdx-humanitarian-datasets')
if (!api) throw new Error('Missing hdx-humanitarian-datasets fixture')

describe('IFRC GO humanitarian event semantic preview', () => {
  afterEach(cleanup)
  it('keeps IFRC, government, and other-source field-report impacts separate', () => {
    render(<ResponseDemoPreview api={api} data={{ results: [{
      id: 8081, name: 'BIH: Fire', dtype: { name: 'Fire' }, countries: [{ name: 'Bosnia and Herzegovina', iso3: 'BIH' }],
      ifrc_severity_level_display: 'Yellow', disaster_start_date: '2026-09-04T00:00:00Z', glide: '', active_deployments: 0,
      summary: '<p>Wildfires affected multiple regions.</p>',
      field_reports: [{ report_date: '2026-09-06T21:46:09Z', num_affected: 0, num_dead: 0, num_displaced: 0, gov_num_affected: 0, gov_num_dead: 0, gov_num_displaced: 0, other_num_affected: 50000, other_num_dead: 0, other_num_displaced: 0 }],
    }] }}/>)
    const preview = screen.getByRole('region', { name: 'IFRC GO Emergency Events' })
    expect(preview).toHaveAttribute('data-preview-layout', 'humanitarian-events')
    const event = preview.querySelector('[data-event-id="8081"]')
    expect(event).toHaveAttribute('data-country-iso3', 'BIH')
    expect(event).toHaveAttribute('data-ifrc-affected', '0')
    expect(event).toHaveAttribute('data-government-affected', '0')
    expect(event).toHaveAttribute('data-other-affected', '50000')
    expect(preview).toHaveTextContent('Wildfires affected multiple regions.')
    expect(preview).toHaveTextContent('Other source')
    expect(preview).toHaveTextContent('50,000')
    expect(preview).toHaveTextContent('not treated as the event-wide humanitarian total')
  })
  it('does not invent field-report impacts when no field report exists', () => {
    render(<ResponseDemoPreview api={api} data={{ results: [{ id: 8082, name: 'Honduras - Drought Assessment', dtype: { name: 'Drought' }, countries: [{ name: 'Honduras', iso3: 'HND' }], disaster_start_date: '2026-08-21T00:00:00Z', field_reports: [] }] }}/>)
    const preview = screen.getByRole('region', { name: 'IFRC GO Emergency Events' })
    expect(preview).toHaveTextContent('No field report supplied')
    expect(preview.querySelector('.humanitarian-impact')).not.toBeInTheDocument()
  })
})
