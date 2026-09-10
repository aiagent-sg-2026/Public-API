import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const agencyApi = apiCatalog.find((candidate) => candidate.id === 'fiscal-data-treasury')
const awardsApi = apiCatalog.find((candidate) => candidate.id === 'usaspending')
if (!agencyApi || !awardsApi) throw new Error('Missing USAspending fixtures')

describe('USAspending semantic previews', () => {
  afterEach(cleanup)

  it('renders the agency endpoint as an overview without inventing spending totals', () => {
    render(<ResponseDemoPreview api={agencyApi} data={{
      fiscal_year: 2026,
      toptier_code: '020',
      name: 'Department of the Treasury',
      abbreviation: 'TREAS',
      agency_id: 456,
      mission: 'Maintain a strong economy and manage the U.S. Government finances effectively.',
      website: 'https://www.treasury.gov/',
      congressional_justification_url: 'https://www.treasury.gov/cj',
      subtier_agency_count: 14,
      def_codes: [{ code: 'N', title: 'CARES Act', public_law: 'Emergency P.L. 116-136', disaster: 'covid_19' }],
    }}/>)

    const preview = screen.getByRole('region', { name: 'U.S. Treasury Agency Overview' })
    expect(preview).toHaveAttribute('data-preview-layout', 'federal-agency-overview')
    const card = preview.querySelector('.federal-agency-preview')
    expect(card).toHaveAttribute('data-fiscal-year', '2026')
    expect(card).toHaveAttribute('data-toptier-code', '020')
    expect(card).toHaveAttribute('data-subtier-count', '14')
    expect(preview).toHaveTextContent('Maintain a strong economy')
    expect(preview).toHaveTextContent('CARES Act')
    expect(screen.getByRole('link', { name: 'Open agency website' })).toHaveAttribute('href', 'https://www.treasury.gov/')
    expect(preview).toHaveTextContent('does not itself return award obligations or budgetary-resource totals')
    expect(preview).not.toHaveTextContent('federal spending profile')
  })

  it('keeps USAspending award amounts, obligation dates, agencies and provider messages explicit', () => {
    render(<ResponseDemoPreview api={awardsApi} data={{
      spending_level: 'awards',
      limit: 2,
      results: [{
        internal_id: 1,
        'Award ID': 'FA521525P0037',
        'Recipient Name': 'MCS OF TAMPA, INC.',
        'Award Amount': 437441.54,
        'Base Obligation Date': '2025-09-30',
        'Awarding Agency': 'Department of Defense',
        'Awarding Sub Agency': 'Department of the Air Force',
        'Funding Agency': 'Department of Defense',
        'Funding Sub Agency': 'Department of the Air Force',
        'Contract Award Type': 'PURCHASE ORDER',
        Description: 'Installation of communications hardware and software.',
      }],
      page_metadata: { page: 1, hasNext: true },
      messages: ['Search data begins in FY2008 for this endpoint.'],
    }}/>)

    const preview = screen.getByRole('region', { name: 'USAspending Contract Awards' })
    expect(preview).toHaveAttribute('data-preview-layout', 'federal-awards')
    const card = preview.querySelector('.federal-awards-preview')
    expect(card).toHaveAttribute('data-primary-award-id', 'FA521525P0037')
    expect(card).toHaveAttribute('data-primary-award-amount', '437441.54')
    expect(card).toHaveAttribute('data-primary-award-amount-semantic', 'total_obligation')
    expect(card).toHaveAttribute('data-primary-obligation-date', '2025-09-30')
    const award = preview.querySelector('[data-award-id="FA521525P0037"]')
    expect(award).toHaveAttribute('data-contract-award-type', 'PURCHASE ORDER')
    expect(preview).toHaveTextContent('$437,441.54')
    expect(preview).toHaveTextContent('Award Amount · total obligation')
    expect(preview).toHaveTextContent('new_awards_only')
    expect(preview).toHaveTextContent('Base obligation date')
    expect(preview).toHaveTextContent('Department of the Air Force')
    expect(preview).toHaveTextContent('Search data begins in FY2008')
    expect(preview).toHaveTextContent('not a single transaction amount or a potential award ceiling')
    expect(preview).not.toHaveTextContent('USAspending Contract Awards record 1')
  })

  it('renders an explicit empty award state', () => {
    render(<ResponseDemoPreview api={awardsApi} data={{ spending_level: 'awards', limit: 8, results: [], page_metadata: { page: 1, hasNext: false } }}/>)
    expect(screen.getByText('No contract awards returned')).toBeInTheDocument()
  })
})
