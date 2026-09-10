import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'malaysia-core-cpi')
if (!api) throw new Error('Missing malaysia-core-cpi fixture')

describe('Malaysia core CPI semantic preview', () => {
  afterEach(cleanup)
  it('renders an overall monthly index trend without calling it an inflation percentage', () => {
    render(<ResponseDemoPreview api={api} data={[{ date: '2026-07-01', division: 'overall', index: 136.2 }, { date: '2026-06-01', division: 'overall', index: 136.2 }, { date: '2026-05-01', division: 'overall', index: 136.0 }]}/>)
    const preview = screen.getByRole('region', { name: 'Malaysia Core CPI' })
    expect(preview).toHaveAttribute('data-preview-layout', 'core-cpi-index')
    const card = preview.querySelector('.malaysia-core-cpi-preview')
    expect(card).toHaveAttribute('data-primary-index', '136.2')
    expect(card).toHaveAttribute('data-latest-date', '2026-07-01')
    expect(card).toHaveAttribute('data-series-count', '3')
    expect(card).toHaveAttribute('data-division', 'overall')
    expect(preview).toHaveTextContent('Index, not inflation %')
    expect(screen.getByRole('img', { name: 'Malaysia overall core CPI index trend' })).toBeInTheDocument()
  })
  it('fails closed when no numeric overall index is returned', () => {
    render(<ResponseDemoPreview api={api} data={[{ date: '2026-07-01', division: '02', index: null }]}/>)
    expect(screen.getByRole('region', { name: 'Malaysia Core CPI' })).toHaveTextContent('Core CPI index unavailable')
  })
})
