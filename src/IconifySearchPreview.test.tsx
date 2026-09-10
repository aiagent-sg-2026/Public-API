import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'iconify-search')
if (!api) throw new Error('Missing Iconify fixture')

describe('Iconify semantic search preview', () => {
  afterEach(cleanup)

  it('preserves icon identity and collection licence metadata', () => {
    render(<ResponseDemoPreview api={api} data={{
      icons: ['material-symbols:home', 'lucide:house'], total: 2, limit: 32, start: 0,
      request: { query: 'home', limit: '32' },
      collections: {
        'material-symbols': { name: 'Material Symbols', total: 15618, author: { name: 'Google' }, license: { title: 'Apache 2.0', spdx: 'Apache-2.0' } },
        lucide: { name: 'Lucide', total: 1660, version: '0.468.0', author: { name: 'Lucide Contributors' }, license: { title: 'ISC', spdx: 'ISC' } },
      },
    }}/>)

    const preview = screen.getByRole('region', { name: 'Iconify Search' })
    expect(preview).toHaveAttribute('data-preview-layout', 'icon-catalog')
    expect(preview).toHaveAttribute('data-ssot-fallback', 'false')
    const card = preview.querySelector('.iconify-search-preview')
    expect(card).toHaveAttribute('data-primary-icon-id', 'material-symbols:home')
    expect(card).toHaveAttribute('data-query', 'home')
    expect(card).toHaveAttribute('data-provider-limit', '32')
    const first = card?.querySelector('[data-record-index="1"]')
    expect(first).toHaveAttribute('data-icon-prefix', 'material-symbols')
    expect(first).toHaveAttribute('data-license-spdx', 'Apache-2.0')
    expect(preview).toHaveTextContent('material-symbols:home')
    expect(preview).toHaveTextContent('Google')
    expect(preview).toHaveTextContent('Apache 2.0 · Apache-2.0')
    expect(preview).not.toHaveTextContent('Iconify Search record 1')
  })
})
