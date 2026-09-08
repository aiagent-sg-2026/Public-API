import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'openfda-food-recalls')
if (!api) throw new Error('Missing openfda-food-recalls fixture')

describe('openFDA food recall semantic preview', () => {
  afterEach(cleanup)

  it('renders enforcement identity, risk, dates and recall narratives instead of generic record output', () => {
    render(<ResponseDemoPreview api={api} data={{
      meta: { last_updated: '2026-08-19', results: { skip: 0, limit: 8, total: 1668 } },
      results: [{
        recall_number: 'F-0865-2017',
        classification: 'Class II',
        status: 'Terminated',
        recalling_firm: 'Magic Gourmet Trading Inc',
        recall_initiation_date: '20160831',
        report_date: '20170118',
        city: 'Millbrae',
        state: 'CA',
        country: 'United States',
        voluntary_mandated: 'Voluntary: Firm initiated',
        product_quantity: '2 cases',
        distribution_pattern: 'CA, WA, OR.',
        product_description: 'Koi Palace Mini Moon Cake: Single Box - Mini Oolong Tea Paste',
        reason_for_recall: 'Undeclared ingredients include wheat and peanut oil.',
        code_info: 'Best by Nov 1, 2016.',
      }, {
        recall_number: 'F-9999-2017',
        classification: 'Class I',
        status: 'Ongoing',
        recalling_firm: 'Example Foods',
        product_description: 'Peanut snack product',
      }],
    }}/>)

    const preview = screen.getByRole('region', { name: 'openFDA Food Recalls' })
    expect(preview).toHaveAttribute('data-preview-layout', 'food-recalls')
    const recall = preview.querySelector('.food-recall-preview')
    expect(recall).toHaveAttribute('data-primary-recall-number', 'F-0865-2017')
    expect(recall).toHaveAttribute('data-primary-classification', 'Class II')
    expect(recall).toHaveAttribute('data-primary-status', 'Terminated')
    expect(recall).toHaveAttribute('data-primary-recalling-firm', 'Magic Gourmet Trading Inc')
    expect(recall).toHaveAttribute('data-primary-recall-initiation-date', '2016-08-31')
    expect(recall).toHaveAttribute('data-provider-match-count', '1668')
    expect(recall).toHaveAttribute('data-provider-last-updated', '2026-08-19')
    expect(within(preview).getByRole('heading', { name: 'Recall F-0865-2017' })).toBeInTheDocument()
    expect(within(preview).getByRole('heading', { name: 'Reason for recall' })).toBeInTheDocument()
    expect(preview).toHaveTextContent('Undeclared ingredients include wheat and peanut oil.')
    expect(preview).toHaveTextContent('2016-08-31')
    expect(preview).toHaveTextContent('Other recall records')
    expect(preview).not.toHaveTextContent('openFDA Food Recalls record 1')
    expect(preview).not.toHaveTextContent('properties')
  })
})
