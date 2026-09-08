import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'uniprot-protein')
if (!api) throw new Error('Missing uniprot-protein fixture')

describe('UniProt protein annotation semantic preview', () => {
  afterEach(cleanup)

  it('preserves stable protein identity, sequence facts, and provider function annotations', () => {
    render(<ResponseDemoPreview api={api} data={{
      entryType: 'UniProtKB reviewed (Swiss-Prot)',
      primaryAccession: 'P05067',
      uniProtkbId: 'A4_HUMAN',
      annotationScore: 5,
      organism: { scientificName: 'Homo sapiens', commonName: 'Human', taxonId: 9606 },
      proteinDescription: { recommendedName: { fullName: { value: 'Amyloid-beta precursor protein' } } },
      genes: [{ geneName: { value: 'APP' }, synonyms: [{ value: 'A4' }, { value: 'AD1' }] }],
      sequence: { length: 770, molWeight: 86943 },
      comments: [
        { commentType: 'FUNCTION', texts: [{ value: 'Functions as a cell surface receptor.' }] },
        { commentType: 'FUNCTION', molecule: 'Amyloid-beta protein 42', texts: [{ value: 'May activate mononuclear phagocytes.' }] },
      ],
    }}/>)

    const preview = screen.getByRole('region', { name: 'UniProt Protein Lookup' })
    expect(preview).toHaveAttribute('data-preview-layout', 'protein-annotation')
    const card = preview.querySelector('.protein-annotation-preview')
    expect(card).toHaveAttribute('data-primary-accession', 'P05067')
    expect(card).toHaveAttribute('data-primary-entry-name', 'A4_HUMAN')
    expect(card).toHaveAttribute('data-primary-protein-name', 'Amyloid-beta precursor protein')
    expect(card).toHaveAttribute('data-primary-gene', 'APP')
    expect(card).toHaveAttribute('data-organism-name', 'Homo sapiens')
    expect(card).toHaveAttribute('data-organism-taxon-id', '9606')
    expect(card).toHaveAttribute('data-entry-type', 'UniProtKB reviewed (Swiss-Prot)')
    expect(card).toHaveAttribute('data-annotation-score', '5')
    expect(card).toHaveAttribute('data-sequence-length', '770')
    expect(card).toHaveAttribute('data-molecular-weight-daltons', '86943')
    expect(card).toHaveAttribute('data-function-comment-count', '2')
    expect(within(preview).getByRole('heading', { name: 'Amyloid-beta precursor protein' })).toBeInTheDocument()
    expect(within(preview).getByRole('heading', { name: 'Function' })).toBeInTheDocument()
    expect(preview).toHaveTextContent('A4_HUMAN')
    expect(preview).toHaveTextContent('APP')
    expect(preview).toHaveTextContent('770 residues')
    expect(preview).toHaveTextContent('86,943 Da')
    expect(preview).toHaveTextContent('Functions as a cell surface receptor.')
    expect(preview).toHaveTextContent('Amyloid-beta protein 42')
    expect(preview).not.toHaveTextContent('UniProt Protein Lookup record 1')
    expect(preview).not.toHaveTextContent('properties')
  })

  it('does not misclassify an unreviewed TrEMBL entry as reviewed', () => {
    render(<ResponseDemoPreview api={api} data={{
      entryType: 'UniProtKB unreviewed (TrEMBL)',
      primaryAccession: 'A0A000',
      uniProtkbId: 'EXAMPLE_HUMAN',
      proteinDescription: { submissionNames: [{ fullName: { value: 'Example protein' } }] },
      organism: { scientificName: 'Homo sapiens', taxonId: 9606 },
      sequence: { length: 100, molWeight: 11000 },
    }}/>)

    const preview = screen.getByRole('region', { name: 'UniProt Protein Lookup' })
    const state = preview.querySelector('.domain-state')
    expect(state).toHaveTextContent('UniProtKB unreviewed (TrEMBL)')
    expect(state).toHaveClass('warning')
  })
})
