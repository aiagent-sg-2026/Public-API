import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'malaysia-household-income')
if (!api) throw new Error('Missing malaysia-household-income fixture')

describe('Malaysia household income semantic preview', () => {
  afterEach(cleanup)
  it('preserves nominal mean and median HIES survey observations', () => {
    render(<ResponseDemoPreview api={api} data={[
      { date: '2024-01-01', income_mean: 9155, income_median: 7017 },
      { date: '2022-01-01', income_mean: 8479, income_median: 6338 },
      { date: '2020-01-01', income_mean: 7089, income_median: 5209 },
    ]}/>)
    const preview = screen.getByRole('region', { name: 'Malaysia Household Income' })
    expect(preview).toHaveAttribute('data-preview-layout', 'household-income')
    const card = preview.querySelector('.household-income-preview')
    expect(card).toHaveAttribute('data-latest-date', '2024-01-01')
    expect(card).toHaveAttribute('data-latest-mean-rm', '9155')
    expect(card).toHaveAttribute('data-latest-median-rm', '7017')
    expect(card).toHaveAttribute('data-observation-count', '3')
    expect(card).toHaveAttribute('data-price-basis', 'nominal')
    expect(preview).toHaveTextContent('RM 7,017')
    expect(preview).toHaveTextContent('not inflation-adjusted')
    expect(screen.getByRole('img', { name: 'Malaysia median monthly household income trend' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Malaysia mean monthly household income trend' })).toBeInTheDocument()
  })
})
