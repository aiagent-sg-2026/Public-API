import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'uk-food-hygiene')
if (!api) throw new Error('Missing uk-food-hygiene fixture')

describe('UK food hygiene rating semantic preview', () => {
  afterEach(cleanup)
  it('distinguishes the overall rating direction from intervention component scores', () => {
    render(<ResponseDemoPreview api={api} data={{ meta: { totalCount: 42 }, establishments: [{ FHRSID: 79912, BusinessName: 'Cafe Cafe', BusinessType: 'Restaurant/Cafe/Canteen', AddressLine2: '108 Bute Street', AddressLine3: 'Treorchy', PostCode: 'CF42 6AU', RatingValue: '5', RatingDate: '2025-11-10T00:00:00', SchemeType: 'FHRS', NewRatingPending: false, LocalAuthorityName: 'Rhondda Cynon Taf', scores: { Hygiene: 5, Structural: 25, ConfidenceInManagement: 30 }, geocode: { longitude: '-3.507796', latitude: '51.660498' } }] }}/>)
    const preview = screen.getByRole('region', { name: 'UK Food Hygiene Ratings' })
    expect(preview).toHaveAttribute('data-preview-layout', 'food-hygiene-ratings')
    const card = preview.querySelector('.food-hygiene-preview')
    expect(card).toHaveAttribute('data-provider-total-count', '42')
    expect(card).toHaveAttribute('data-primary-fhrs-id', '79912')
    expect(card).toHaveAttribute('data-score-direction', 'lower-intervention-score-is-better')
    expect(preview).toHaveTextContent('5/5 · Very good')
    expect(preview).toHaveTextContent('Hygiene5 · Good')
    expect(preview).toHaveTextContent('Structural25 · Urgent improvement necessary')
    expect(preview).toHaveTextContent('Confidence in management30 · Urgent improvement necessary')
    expect(preview).toHaveTextContent('component intervention scores run in the opposite direction')
  })
  it('does not fabricate FHRS component scores for another scheme', () => {
    render(<ResponseDemoPreview api={api} data={{ establishments: [{ FHRSID: 1, BusinessName: 'Scottish Shop', RatingValue: 'Pass', SchemeType: 'FHIS' }] }}/>)
    expect(screen.getByRole('region', { name: 'UK Food Hygiene Ratings' })).toHaveTextContent('Component scores are not supplied for this record or scheme.')
  })
})
