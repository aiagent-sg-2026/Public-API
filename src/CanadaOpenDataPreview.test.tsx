import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'canada-open-data-search')
if (!api) throw new Error('Missing Canada Open Data fixture')

describe('Canada Open Data semantic preview', () => {
  afterEach(cleanup)

  it('preserves dataset/publication identity, bilingual metadata, licence, and resource semantics', () => {
    render(<ResponseDemoPreview api={api} data={{ success: true, result: { count: 2863, results: [{
      id: '09ffaeb5-ec8f-5bb5-bdcb-3436ccf26f58',
      title: 'Climatic Regions', title_translated: { en: 'Climatic Regions', fr: 'Régions climatiques' },
      notes: 'Historical climatic regions.', notes_translated: { en: 'Historical climatic regions.', fr: 'Régions climatiques historiques.' },
      collection: 'geogratis', type: 'dataset',
      organization: { title: 'Natural Resources Canada | Ressources naturelles Canada' },
      date_published: '1957-01-01 00:00:00', portal_release_date: '2017-01-18',
      license_title: 'Open Government Licence - Canada', restrictions: 'unrestricted',
      resources: [
        { format: 'JPG', language: ['en', 'fr'], resource_type: 'dataset' },
        { format: 'PDF', language: ['en', 'fr'], resource_type: 'dataset' },
      ],
    }] } }}/>)

    const preview = screen.getByRole('region', { name: 'Canada Open Data Search' })
    expect(preview).toHaveAttribute('data-preview-layout', 'open-data-catalog')
    expect(preview).toHaveAttribute('data-ssot-fallback', 'false')
    const card = preview.querySelector('.canada-open-data-preview')
    expect(card).toHaveAttribute('data-total-results', '2863')
    expect(card).toHaveAttribute('data-primary-record-id', '09ffaeb5-ec8f-5bb5-bdcb-3436ccf26f58')
    expect(card).toHaveAttribute('data-primary-record-type', 'dataset')
    const record = preview.querySelector('[data-record-id="09ffaeb5-ec8f-5bb5-bdcb-3436ccf26f58"]')
    expect(record).toHaveAttribute('data-record-type', 'dataset')
    expect(record).toHaveAttribute('data-collection', 'geogratis')
    expect(record).toHaveAttribute('data-license', 'Open Government Licence - Canada')
    expect(record).toHaveAttribute('data-resource-count', '2')
    expect(preview).toHaveTextContent('Climatic Regions')
    expect(preview).toHaveTextContent('Régions climatiques')
    expect(preview).toHaveTextContent('Natural Resources Canada | Ressources naturelles Canada')
    expect(preview).toHaveTextContent('JPG · PDF')
    expect(preview).toHaveTextContent('en · fr')
    expect(preview).toHaveTextContent('2,863 matches total')
    expect(preview).not.toHaveTextContent('Canada Open Data Search record 1')
  })

  it('does not relabel a provider publication as a dataset', () => {
    render(<ResponseDemoPreview api={api} data={{ success: true, result: { count: 1, results: [{
      id: 'publication-1', title: 'Artificial Intelligence - ITSAP.00.040', collection: 'publication', type: 'info',
      organization: { title: 'Communications Security Establishment Canada' }, license_title: 'Open Government Licence - Canada', restrictions: 'unrestricted',
      resources: [{ format: 'HTML', language: ['en'], resource_type: 'publication' }],
    }] } }}/>)
    const record = screen.getByRole('region', { name: 'Canada Open Data Search' }).querySelector('[data-record-id="publication-1"]')
    expect(record).toHaveAttribute('data-record-type', 'info')
    expect(record).toHaveAttribute('data-collection', 'publication')
    expect(record).toHaveTextContent('info · collection publication')
    expect(record).not.toHaveTextContent('dataset · collection publication')
  })
})
