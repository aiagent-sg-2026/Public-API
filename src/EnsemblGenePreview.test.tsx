import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'ensembl-gene-lookup')
if (!api) throw new Error('Missing ensembl-gene-lookup fixture')

describe('Ensembl gene semantic preview', () => {
  afterEach(cleanup)

  it('preserves stable identity, assembly coordinates, strand, biotype, and canonical transcript', () => {
    render(<ResponseDemoPreview api={api} data={{
      id: 'ENSG00000157764',
      version: 16,
      display_name: 'BRAF',
      description: 'B-Raf proto-oncogene, serine/threonine kinase [Source:HGNC Symbol;Acc:HGNC:1097]',
      biotype: 'protein_coding',
      species: 'homo_sapiens',
      assembly_name: 'GRCh38',
      seq_region_name: '7',
      start: 140719327,
      end: 140925199,
      strand: -1,
      object_type: 'Gene',
      canonical_transcript: 'ENST00000646891.2',
      source: 'ensembl_havana',
      db_type: 'core',
    }}/>)

    const preview = screen.getByRole('region', { name: 'Ensembl Gene Lookup' })
    expect(preview).toHaveAttribute('data-preview-layout', 'gene-locus')
    expect(preview).toHaveAttribute('data-ssot-fallback', 'false')
    const card = preview.querySelector('.ensembl-gene-preview')
    expect(card).toHaveAttribute('data-primary-gene-id', 'ENSG00000157764')
    expect(card).toHaveAttribute('data-gene-version', '16')
    expect(card).toHaveAttribute('data-gene-symbol', 'BRAF')
    expect(card).toHaveAttribute('data-biotype', 'protein_coding')
    expect(card).toHaveAttribute('data-species', 'homo_sapiens')
    expect(card).toHaveAttribute('data-assembly', 'GRCh38')
    expect(card).toHaveAttribute('data-seq-region', '7')
    expect(card).toHaveAttribute('data-start', '140719327')
    expect(card).toHaveAttribute('data-end', '140925199')
    expect(card).toHaveAttribute('data-strand', '-1')
    expect(card).toHaveAttribute('data-canonical-transcript', 'ENST00000646891.2')
    expect(within(preview).getByRole('heading', { name: 'BRAF' })).toBeInTheDocument()
    expect(within(preview).getByRole('heading', { name: 'Gene description' })).toBeInTheDocument()
    expect(preview).toHaveTextContent('ENSG00000157764.16')
    expect(preview).toHaveTextContent('GRCh38 · 7:140,719,327–140,925,199')
    expect(preview).toHaveTextContent('-1 (reverse)')
    expect(preview).toHaveTextContent('ENST00000646891.2')
    expect(preview).toHaveTextContent('B-Raf proto-oncogene, serine/threonine kinase')
    expect(preview).not.toHaveTextContent('Ensembl Gene Lookup record 1')
  })

  it('does not invent a canonical transcript when the provider omits it', () => {
    render(<ResponseDemoPreview api={api} data={{ id: 'ENSG00000999999', display_name: 'EXAMPLE', species: 'homo_sapiens' }}/>)
    const preview = screen.getByRole('region', { name: 'Ensembl Gene Lookup' })
    expect(preview.querySelector('.ensembl-gene-preview')).not.toHaveAttribute('data-canonical-transcript')
    expect(preview).toHaveTextContent('Canonical transcriptNot supplied')
  })
})
