import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'rcsb-pdb-entry')
if (!api) throw new Error('Missing rcsb-pdb-entry fixture')

describe('RCSB PDB molecular structure semantic preview', () => {
  afterEach(cleanup)

  it('preserves structure identity, experimental method, resolution, archive facts, and primary citation', () => {
    render(<ResponseDemoPreview api={api} data={{
      entry: { id: '4HHB' },
      struct: { title: 'THE CRYSTAL STRUCTURE OF HUMAN DEOXYHAEMOGLOBIN AT 1.74 ANGSTROMS RESOLUTION' },
      exptl: [{ method: 'X-RAY DIFFRACTION' }],
      refine: [{ ls_d_res_high: 1.74 }],
      rcsb_entry_info: {
        polymer_composition: 'heteromeric protein',
        polymer_entity_count: 2,
        entity_count: 5,
        deposited_atom_count: 4779,
        assembly_count: 1,
        nonpolymer_bound_components: ['HEM'],
      },
      rcsb_accession_info: {
        deposit_date: '1984-03-07T00:00:00.000+00:00',
        initial_release_date: '1984-07-17T00:00:00.000+00:00',
        revision_date: '2026-08-12T00:00:00.000+00:00',
        status_code: 'REL',
      },
      citation: [{
        id: 'primary',
        rcsb_is_primary: 'Y',
        title: 'The crystal structure of human deoxyhaemoglobin at 1.74 A resolution',
        rcsb_journal_abbrev: 'J Mol Biol',
        year: 1984,
        rcsb_authors: ['Fermi, G.', 'Perutz, M.F.', 'Shaanan, B.', 'Fourme, R.'],
        pdbx_database_id_DOI: '10.1016/0022-2836(84)90472-8',
        pdbx_database_id_PubMed: 6726807,
      }],
    }}/>)

    const preview = screen.getByRole('region', { name: 'RCSB Protein Data Bank Entry' })
    expect(preview).toHaveAttribute('data-preview-layout', 'molecular-structure')
    const card = preview.querySelector('.pdb-structure-preview')
    expect(card).toHaveAttribute('data-entry-id', '4HHB')
    expect(card).toHaveAttribute('data-experimental-method', 'X-RAY DIFFRACTION')
    expect(card).toHaveAttribute('data-resolution-angstroms', '1.74')
    expect(card).toHaveAttribute('data-polymer-composition', 'heteromeric protein')
    expect(card).toHaveAttribute('data-polymer-entity-count', '2')
    expect(card).toHaveAttribute('data-entity-count', '5')
    expect(card).toHaveAttribute('data-deposited-atom-count', '4779')
    expect(card).toHaveAttribute('data-primary-citation-doi', '10.1016/0022-2836(84)90472-8')
    expect(card).toHaveAttribute('data-initial-release-date', '1984-07-17')
    expect(card).toHaveAttribute('data-revision-date', '2026-08-12')
    expect(within(preview).getByRole('heading', { name: 'THE CRYSTAL STRUCTURE OF HUMAN DEOXYHAEMOGLOBIN AT 1.74 ANGSTROMS RESOLUTION' })).toBeInTheDocument()
    expect(within(preview).getByRole('heading', { name: 'The crystal structure of human deoxyhaemoglobin at 1.74 A resolution' })).toBeInTheDocument()
    expect(preview).toHaveTextContent('X-RAY DIFFRACTION')
    expect(preview).toHaveTextContent('1.74 Å')
    expect(preview).toHaveTextContent('4,779')
    expect(preview).toHaveTextContent('Fermi, G., Perutz, M.F., Shaanan, B., Fourme, R.')
    expect(preview).toHaveTextContent('10.1016/0022-2836(84)90472-8')
    expect(preview).not.toHaveTextContent('RCSB Protein Data Bank Entry record 1')
    expect(preview).not.toHaveTextContent('properties')
  })

  it('fails closed when the provider response has no PDB entry ID', () => {
    render(<ResponseDemoPreview api={api} data={{ struct: { title: 'Incomplete entry' } }}/>)
    const preview = screen.getByRole('region', { name: 'RCSB Protein Data Bank Entry' })
    expect(preview).toHaveAttribute('data-preview-layout', 'molecular-structure')
    expect(preview).toHaveTextContent('Structure record unavailable')
    expect(preview.querySelector('[data-domain-card="molecular-structure"]')).toHaveAttribute('data-result-state', 'empty')
  })
})
