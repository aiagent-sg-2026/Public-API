import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'pubchem-compound')
if (!api) throw new Error('Missing pubchem-compound fixture')

describe('PubChem compound semantic preview', () => {
  afterEach(cleanup)

  it('preserves PubChem compound identity and the requested property-table fields', () => {
    render(<ResponseDemoPreview api={api} data={{
      PropertyTable: {
        Properties: [{
          CID: 2244,
          MolecularFormula: 'C9H8O4',
          MolecularWeight: '180.16',
          IUPACName: '2-acetyloxybenzoic acid',
        }],
      },
    }}/>)

    const preview = screen.getByRole('region', { name: 'PubChem Compound Lookup' })
    expect(preview).toHaveAttribute('data-preview-layout', 'compound-properties')
    expect(preview).toHaveAttribute('data-ssot-fallback', 'false')

    const card = preview.querySelector('.pubchem-compound-preview')
    expect(card).toHaveAttribute('data-primary-cid', '2244')
    expect(card).toHaveAttribute('data-primary-iupac-name', '2-acetyloxybenzoic acid')
    expect(card).toHaveAttribute('data-molecular-formula', 'C9H8O4')
    expect(card).toHaveAttribute('data-molecular-weight', '180.16')
    expect(within(preview).getByRole('heading', { name: '2-acetyloxybenzoic acid' })).toBeInTheDocument()
    expect(preview).toHaveTextContent('C9H8O4')
    expect(preview).toHaveTextContent('180.16 g/mol')
    expect(preview).not.toHaveTextContent('PubChem Compound Lookup record 1')
    expect(preview.querySelector('.semantic-card-grid')).not.toBeInTheDocument()
  })

  it('fails semantically closed when the property table has no compound record', () => {
    render(<ResponseDemoPreview api={api} data={{ PropertyTable: { Properties: [] } }}/>)

    const preview = screen.getByRole('region', { name: 'PubChem Compound Lookup' })
    const empty = preview.querySelector('[data-domain-card="compound-properties"]')
    expect(empty).toHaveAttribute('data-result-state', 'empty')
    expect(preview).toHaveTextContent('Compound properties unavailable')
  })
})
