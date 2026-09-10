import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'unhcr-refugees')
if (!api) throw new Error('Missing unhcr-refugees fixture')

describe('UNHCR refugee population semantic preview', () => {
  afterEach(cleanup)

  it('preserves year-end displacement and return figures with ISO identity', () => {
    render(<ResponseDemoPreview api={api} data={{ items: [{
      year: 2025,
      coo_name: 'Syrian Arab Rep.',
      coo: 'SYR',
      coo_iso: 'SYR',
      refugees: 4865764,
      asylum_seekers: 154355,
      returned_refugees: 1341148,
      idps: 5542227,
      returned_idps: 1964201,
      stateless: '0',
    }] }}/>)

    const preview = screen.getByRole('region', { name: 'UNHCR Refugee Statistics' })
    expect(preview).toHaveAttribute('data-preview-layout', 'refugee-population')
    const card = preview.querySelector('.refugee-population-preview')
    expect(card).toHaveAttribute('data-primary-origin-iso', 'SYR')
    expect(card).toHaveAttribute('data-reporting-year', '2025')
    expect(card).toHaveAttribute('data-refugees', '4865764')
    expect(card).toHaveAttribute('data-returned-refugees', '1341148')
    expect(card).toHaveAttribute('data-returned-idps', '1964201')
    expect(preview).toHaveTextContent('Syrian Arab Rep. · 2025')
    expect(preview).toHaveTextContent('4,865,764')
    expect(preview).toHaveTextContent('1,341,148')
    expect(preview).toHaveTextContent('1,964,201')
    expect(preview).toHaveTextContent('cf_type=ISO')
  })

  it('fails semantically closed when no population row is returned', () => {
    render(<ResponseDemoPreview api={api} data={{ items: [] }}/>)
    const preview = screen.getByRole('region', { name: 'UNHCR Refugee Statistics' })
    expect(preview.querySelector('[data-domain-card="refugee-population"]')).toHaveAttribute('data-result-state', 'empty')
  })
})
