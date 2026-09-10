import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'wikidata-sparql')
if (!api) throw new Error('Missing wikidata-sparql fixture')

describe('Wikidata entity semantic preview', () => {
  afterEach(cleanup)

  it('preserves label, QID, URI, and language from the SPARQL binding', () => {
    render(<ResponseDemoPreview api={api} data={{
      head: { vars: ['item', 'itemLabel'] },
      results: { bindings: [{
        item: { type: 'uri', value: 'http://www.wikidata.org/entity/Q60' },
        itemLabel: { 'xml:lang': 'en', type: 'literal', value: 'New York City' },
      }] },
    }}/>)
    const preview = screen.getByRole('region', { name: 'Wikidata SPARQL' })
    expect(preview).toHaveAttribute('data-preview-layout', 'knowledge-entities')
    expect(preview.querySelector('.wikidata-entity-preview')).toHaveAttribute('data-primary-qid', 'Q60')
    expect(preview).toHaveTextContent('New York City')
    expect(preview).toHaveTextContent('Q60')
    expect(preview).toHaveTextContent('http://www.wikidata.org/entity/Q60')
    expect(preview).toHaveTextContent('city (wd:Q515)')
    expect(preview).not.toHaveTextContent('Wikidata SPARQL record 1')
  })
})
