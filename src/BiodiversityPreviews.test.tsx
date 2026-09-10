import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const byId = (id: string) => {
  const api = apiCatalog.find((candidate) => candidate.id === id)
  if (!api) throw new Error(`Missing ${id} fixture`)
  return api
}

describe('biodiversity semantic previews', () => {
  afterEach(cleanup)

  it('keeps OBIS occurrence status, provenance, coordinates, and provider QC flags attached to the record', () => {
    const api = byId('obis-marine-occurrences')
    render(<ResponseDemoPreview api={api} requestUrl="https://api.obis.org/v3/occurrence?scientificname=Delphinus+delphis&size=5" data={{
      total: 121574,
      results: [{
        scientificName: 'Delphinus delphis', originalScientificName: 'Delphinus delphis', occurrenceID: '1406_14803', eventDate: '2000-02-19', occurrenceStatus: 'present', basisOfRecord: 'HumanObservation',
        decimalLatitude: 49.18, decimalLongitude: -1.601, datasetName: 'French stranding network', scientificNameID: 'urn:lsid:marinespecies.org:taxname:137094', aphiaID: 137094, flags: ['NO_DEPTH', 'ON_LAND'], license: 'https://creativecommons.org/licenses/by-nc/4.0/',
      }],
    }}/>)
    const preview = screen.getByRole('region', { name: 'OBIS Marine Occurrences' })
    expect(preview).toHaveAttribute('data-preview-layout', 'marine-occurrences')
    const card = preview.querySelector('.obis-occurrence-preview')
    expect(card).toHaveAttribute('data-requested-scientific-name', 'Delphinus delphis')
    expect(card).toHaveAttribute('data-provider-total', '121574')
    expect(card).toHaveAttribute('data-primary-occurrence-id', '1406_14803')
    expect(card).toHaveAttribute('data-primary-occurrence-status', 'present')
    expect(card).toHaveAttribute('data-primary-basis-of-record', 'HumanObservation')
    expect(card).toHaveAttribute('data-primary-quality-flags', 'NO_DEPTH,ON_LAND')
    expect(preview).toHaveTextContent('French stranding network')
    expect(preview).toHaveTextContent('49.18, -1.601')
    expect(preview).toHaveTextContent('NO_DEPTH')
    expect(preview).toHaveTextContent('ON_LAND')
    expect(preview).not.toHaveTextContent('OBIS Marine Occurrences record 1')
  })

  it('preserves WoRMS unaccepted-name resolution to the current accepted name', () => {
    const api = byId('worms-species-lookup')
    render(<ResponseDemoPreview api={api} requestUrl="https://www.marinespecies.org/rest/AphiaRecordsByName/Manta%20birostris?like=false" data={[{
      AphiaID: 105857, scientificname: 'Manta birostris', authority: '(Walbaum, 1792)', status: 'unaccepted', rank: 'Species', valid_AphiaID: 1026118, valid_name: 'Mobula birostris', valid_authority: '(Walbaum, 1792)',
      kingdom: 'Animalia', phylum: 'Chordata', class: 'Elasmobranchii', order: 'Myliobatiformes', family: 'Mobulidae', genus: 'Manta', lsid: 'urn:lsid:marinespecies.org:taxname:105857', isMarine: 1, isBrackish: 0, isFreshwater: 0, isTerrestrial: 0, isExtinct: null,
    }]}/>)
    const preview = screen.getByRole('region', { name: 'WoRMS Marine Species Registry' })
    expect(preview).toHaveAttribute('data-preview-layout', 'marine-taxonomy')
    const card = preview.querySelector('.worms-species-preview')
    expect(card).toHaveAttribute('data-requested-scientific-name', 'Manta birostris')
    expect(card).toHaveAttribute('data-primary-status', 'unaccepted')
    expect(card).toHaveAttribute('data-primary-aphia-id', '105857')
    expect(card).toHaveAttribute('data-primary-valid-aphia-id', '1026118')
    expect(card).toHaveAttribute('data-primary-valid-name', 'Mobula birostris')
    expect(preview).toHaveTextContent('Manta birostris → Mobula birostris')
    expect(preview).toHaveTextContent('Current accepted name')
    expect(preview).toHaveTextContent('Animalia › Chordata › Elasmobranchii › Myliobatiformes › Mobulidae › Manta')
    expect(preview).toHaveTextContent('ExtinctNot supplied')
    expect(preview).not.toHaveTextContent('WoRMS Marine Species Registry record 1')
  })

  it('labels PBDB n_occs as the fossil count for the taxon plus subtaxa', () => {
    const api = byId('paleobiodb-taxa')
    render(<ResponseDemoPreview api={api} requestUrl="https://paleobiodb.org/data1.2/taxa/list.json?name=Tyrannosaurus&vocab=pbdb" data={{
      elapsed_time: 0.005,
      records: [{ orig_no: '38613', taxon_no: '38613', taxon_rank: 'genus', taxon_name: 'Tyrannosaurus', accepted_no: '38613', accepted_rank: 'genus', accepted_name: 'Tyrannosaurus', parent_no: '92294', reference_no: '9259', is_extant: 'extinct', n_occs: 87 }],
    }}/>)
    const preview = screen.getByRole('region', { name: 'Paleobiology Database Taxa' })
    expect(preview).toHaveAttribute('data-preview-layout', 'fossil-taxon')
    const card = preview.querySelector('.paleobiodb-taxon-preview')
    expect(card).toHaveAttribute('data-requested-taxon-name', 'Tyrannosaurus')
    expect(card).toHaveAttribute('data-primary-taxon-no', '38613')
    expect(card).toHaveAttribute('data-primary-extancy', 'extinct')
    expect(card).toHaveAttribute('data-primary-fossil-occurrence-count', '87')
    expect(preview).toHaveTextContent('Fossil occurrences · taxon + subtaxa87')
    expect(preview).toHaveTextContent('not a direct-only occurrence count')
    expect(preview).not.toHaveTextContent('Paleobiology Database Taxa record 1')
  })
})
