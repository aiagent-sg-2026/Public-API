import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'eurostat-population')
if (!api) throw new Error('Missing eurostat-population fixture')

const dimension = (code: string, label: string, value: string, valueLabel: string) => ({
  label,
  category: { index: { [value]: 0 }, label: { [value]: valueLabel } },
})

describe('Eurostat population semantic preview', () => {
  afterEach(cleanup)

  it('preserves the exact filtered population cell and dimension semantics', () => {
    render(<ResponseDemoPreview api={api} data={{
      label: 'Population on 1 January by age and sex',
      updated: '2026-08-14T23:00:00+0200',
      value: { '0': 83577140 },
      dimension: {
        geo: dimension('geo', 'Geopolitical entity (reporting)', 'DE', 'Germany'),
        time: dimension('time', 'Time', '2025', '2025'),
        unit: dimension('unit', 'Unit of measure', 'NR', 'Number'),
        age: dimension('age', 'Age class', 'TOTAL', 'Total'),
        sex: dimension('sex', 'Sex', 'T', 'Total'),
        freq: dimension('freq', 'Time frequency', 'A', 'Annual'),
      },
    }}/>)

    const preview = screen.getByRole('region', { name: 'Eurostat Population Statistics' })
    expect(preview).toHaveAttribute('data-preview-layout', 'population-statistic')
    const card = preview.querySelector('.eurostat-population-preview')
    expect(card).toHaveAttribute('data-primary-population', '83577140')
    expect(card).toHaveAttribute('data-geo-code', 'DE')
    expect(card).toHaveAttribute('data-reference-year', '2025')
    expect(card).toHaveAttribute('data-unit-code', 'NR')
    expect(card).toHaveAttribute('data-dataset', 'demo_pjan')
    expect(preview).toHaveTextContent('83,577,140 people')
    expect(preview).toHaveTextContent('Germany · Population on 1 January 2025')
    expect(preview).toHaveTextContent('Number (NR)')
    expect(preview).toHaveTextContent('Annual')
  })

  it('fails semantically closed when the statistical cell is absent', () => {
    render(<ResponseDemoPreview api={api} data={{ value: {}, dimension: {} }}/>)
    const preview = screen.getByRole('region', { name: 'Eurostat Population Statistics' })
    expect(preview.querySelector('[data-domain-card="population-statistic"]')).toHaveAttribute('data-result-state', 'empty')
  })
})
