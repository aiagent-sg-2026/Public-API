import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'openfda-drug-labels')
if (!api) throw new Error('Missing openfda-drug-labels fixture')

describe('openFDA drug label semantic preview', () => {
  afterEach(cleanup)

  it('renders regulated label identity and sections instead of generic record/property output', () => {
    render(<ResponseDemoPreview api={api} data={{
      meta: { last_updated: '2026-09-04', results: { skip: 0, limit: 8, total: 39 } },
      results: [{
        openfda: {
          brand_name: ['Advil Dual Action with Acetaminophen'],
          generic_name: ['IBUPROFEN, ACETAMINOPHEN TABLET, FILM COATED'],
          manufacturer_name: ["Lil' Drug Store Products, Inc."],
          product_type: ['HUMAN OTC DRUG'],
          route: ['ORAL'],
          substance_name: ['IBUPROFEN', 'ACETAMINOPHEN'],
        },
        active_ingredient: ['Acetaminophen 250 mg Ibuprofen 125 mg'],
        indications_and_usage: ['Temporarily relieves minor aches and pains.'],
        warnings: ['This product contains acetaminophen and ibuprofen.'],
        dosage_and_administration: ['Adults and children 12 years and over take 2 caplets every 8 hours while symptoms persist.'],
      }],
    }}/>)

    const preview = screen.getByRole('region', { name: 'openFDA Drug Labels' })
    expect(preview).toHaveAttribute('data-preview-layout', 'drug-label')
    const label = preview.querySelector('.drug-label-preview')
    expect(label).toHaveAttribute('data-primary-brand-name', 'Advil Dual Action with Acetaminophen')
    expect(label).toHaveAttribute('data-primary-generic-name', 'IBUPROFEN, ACETAMINOPHEN TABLET, FILM COATED')
    expect(label).toHaveAttribute('data-primary-manufacturer', "Lil' Drug Store Products, Inc.")
    expect(label).toHaveAttribute('data-primary-substances', 'IBUPROFEN, ACETAMINOPHEN')
    expect(label).toHaveAttribute('data-provider-match-count', '39')
    expect(label).toHaveAttribute('data-provider-last-updated', '2026-09-04')
    expect(within(preview).getByRole('heading', { name: 'Active ingredients' })).toBeInTheDocument()
    expect(within(preview).getByRole('heading', { name: 'Indications and uses' })).toBeInTheDocument()
    expect(within(preview).getByRole('heading', { name: 'Warnings' })).toBeInTheDocument()
    expect(within(preview).getByRole('heading', { name: 'Directions' })).toBeInTheDocument()
    expect(preview).toHaveTextContent('Acetaminophen 250 mg Ibuprofen 125 mg')
    expect(preview).toHaveTextContent('Temporarily relieves minor aches and pains.')
    expect(preview).toHaveTextContent('This product contains acetaminophen and ibuprofen.')
    expect(preview).not.toHaveTextContent('openFDA Drug Labels record 1')
    expect(preview).not.toHaveTextContent('properties')
  })
})
