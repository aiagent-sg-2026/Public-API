import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'fema-disasters')
if (!api) throw new Error('Missing fema-disasters fixture')
const row = { femaDeclarationString: 'DR-4943-KS', disasterNumber: 4943, state: 'KS', declarationType: 'DR', declarationDate: '2026-09-01T00:00:00.000Z', incidentType: 'Severe Storm', declarationTitle: 'SEVERE STORMS AND FLOODING', paProgramDeclared: true, incidentBeginDate: '2026-06-18T00:00:00.000Z', incidentEndDate: '2026-06-30T00:00:00.000Z', designatedArea: 'Rawlins (County)', region: 7, lastRefresh: '2026-09-03T11:06:12.500Z', id: 'row-1' }

describe('FEMA disaster declared-area semantic preview', () => {
  afterEach(cleanup)
  it('preserves area-level identity instead of implying each row is a unique disaster', () => {
    render(<ResponseDemoPreview api={api} data={{ DisasterDeclarationsSummaries: [row, { ...row, designatedArea: 'Russell (County)', id: 'row-2' }] }}/>)
    const preview = screen.getByRole('region', { name: 'FEMA Disaster Declarations' })
    expect(preview).toHaveAttribute('data-preview-layout', 'disaster-declared-areas')
    const card = preview.querySelector('.fema-disaster-preview')
    expect(card).toHaveAttribute('data-row-count', '2')
    expect(card).toHaveAttribute('data-unique-declaration-count', '1')
    expect(card).toHaveAttribute('data-primary-declaration-id', 'DR-4943-KS')
    expect(preview).toHaveTextContent('Rawlins (County)')
    expect(preview).toHaveTextContent('Russell (County)')
    expect(preview).toHaveTextContent('repeated disaster IDs are expected')
    expect(preview).toHaveTextContent('PA')
  })
  it('fails semantically closed for an empty result', () => {
    render(<ResponseDemoPreview api={api} data={{ DisasterDeclarationsSummaries: [] }}/>)
    expect(screen.getByRole('region', { name: 'FEMA Disaster Declarations' })).toHaveTextContent('No FEMA declared-area records returned')
  })
})
