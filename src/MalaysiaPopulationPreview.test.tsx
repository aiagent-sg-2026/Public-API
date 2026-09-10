import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'malaysia-population')
if (!api) throw new Error('Missing malaysia-population fixture')

describe('Malaysia population semantic preview', () => {
  afterEach(cleanup)
  it('renders one national total per year and preserves the provider thousand-person unit', () => {
    render(<ResponseDemoPreview api={api} data={[
      { date: '2026-01-01', sex: 'both', age: 'overall', ethnicity: 'overall', population: 34389.4 },
      { date: '2025-01-01', sex: 'both', age: 'overall', ethnicity: 'overall', population: 34220.5 },
    ]}/>)
    const preview = screen.getByRole('region', { name: 'Malaysia Population' })
    expect(preview).toHaveAttribute('data-preview-layout', 'population-total')
    const card = preview.querySelector('.malaysia-population-preview')
    expect(card).toHaveAttribute('data-primary-population-thousand', '34389.4')
    expect(card).toHaveAttribute('data-primary-population-people', '34389400')
    expect(card).toHaveAttribute('data-sex', 'both')
    expect(card).toHaveAttribute('data-age', 'overall')
    expect(card).toHaveAttribute('data-ethnicity', 'overall')
    expect(preview).toHaveTextContent('34,389,400')
    expect(preview).toHaveTextContent("Provider raw ('000 people)34,389.4")
    expect(screen.getByRole('img', { name: 'Malaysia total population trend' })).toBeInTheDocument()
  })
  it('fails closed rather than using a demographic slice as the national total', () => {
    render(<ResponseDemoPreview api={api} data={[{ date: '2026-01-01', sex: 'both', age: '0-4', ethnicity: 'overall', population: 2165.4 }]}/>)
    expect(screen.getByRole('region', { name: 'Malaysia Population' })).toHaveTextContent('Malaysia population total unavailable')
  })
})
