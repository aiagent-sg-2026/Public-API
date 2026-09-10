import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'jolpica-f1')
if (!api) throw new Error('Missing jolpica-f1 fixture')

const wrap = (table: Record<string, unknown>, total = '1') => ({ MRData: { limit: '8', total, ...table } })

describe('Jolpica Formula 1 season semantic preview', () => {
  afterEach(cleanup)

  it('preserves driver identity instead of generic early-property rows', () => {
    render(<ResponseDemoPreview api={api} data={wrap({ DriverTable: { season: '2025', Drivers: [{ driverId: 'albon', permanentNumber: '23', code: 'ALB', givenName: 'Alexander', familyName: 'Albon', dateOfBirth: '1996-03-23', nationality: 'Thai' }] } }, '36')}/>)
    const preview = screen.getByRole('region', { name: 'Jolpica F1 Data' })
    expect(preview).toHaveAttribute('data-preview-layout', 'f1-season-catalog')
    const card = preview.querySelector('.jolpica-f1-preview')
    expect(card).toHaveAttribute('data-dataset', 'drivers')
    expect(card).toHaveAttribute('data-provider-total', '36')
    expect(preview).toHaveTextContent('Alexander Albon')
    expect(preview).toHaveTextContent('NationalityThai')
    expect(preview).not.toHaveTextContent('Jolpica F1 Data record 1')
  })

  it('preserves constructor identity and nationality', () => {
    render(<ResponseDemoPreview api={api} data={wrap({ ConstructorTable: { season: '2025', Constructors: [{ constructorId: 'ferrari', name: 'Ferrari', nationality: 'Italian' }] } }, '10')}/>)
    const preview = screen.getByRole('region', { name: 'Jolpica F1 Data' })
    expect(preview.querySelector('[data-constructor-id="ferrari"]')).toHaveAttribute('data-nationality', 'Italian')
    expect(preview).toHaveTextContent('Ferrari')
  })

  it('keeps race calendar timing, circuit and coordinates semantic', () => {
    render(<ResponseDemoPreview api={api} data={wrap({ RaceTable: { season: '2025', Races: [{ season: '2025', round: '1', raceName: 'Australian Grand Prix', date: '2025-03-16', time: '04:00:00Z', Circuit: { circuitId: 'albert_park', circuitName: 'Albert Park Grand Prix Circuit', Location: { lat: '-37.8497', long: '144.968', locality: 'Melbourne', country: 'Australia' } }, Qualifying: { date: '2025-03-15', time: '05:00:00Z' } }] } }, '24')}/>)
    const preview = screen.getByRole('region', { name: 'Jolpica F1 Data' })
    const race = preview.querySelector('[data-round="1"]')
    expect(race).toHaveAttribute('data-race-start', '2025-03-16T04:00:00Z')
    expect(race).toHaveAttribute('data-circuit-id', 'albert_park')
    expect(preview).toHaveTextContent('Albert Park Grand Prix Circuit')
    expect(preview).toHaveTextContent('Coordinates-37.8497, 144.968')
    expect(preview).toHaveTextContent('season catalogue, not standings or race results')
  })
})
