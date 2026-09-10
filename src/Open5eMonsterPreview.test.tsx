import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'open5e-monster-search')
if (!api) throw new Error('Missing Open5e monster fixture')

describe('Open5e V2 creature semantic preview', () => {
  afterEach(cleanup)
  it('preserves source-aware identity and combat facts without the generic data-table card', () => {
    render(<ResponseDemoPreview api={api} data={{ count: 2, results: [
      { key: 'srd-2024_mimic', name: 'Mimic', document: { name: 'System Reference Document 5.2', key: 'srd-2024', gamesystem: { name: 'Dungeons & Dragons 5e 2024', key: '5e-2024' } }, type: { name: 'Monstrosity', key: 'monstrosity' }, size: { name: 'Medium', key: 'medium' }, challenge_rating: 2, armor_class: 12, hit_points: 58, hit_dice: '9d8+18', speed: { walk: 20, unit: 'feet' }, alignment: 'neutral', passive_perception: 11 },
      { key: 'legacy_mimic', name: 'Mimic', document: { name: 'Another Open Source', key: 'other', gamesystem: { name: 'Compatible 5e', key: '5e' } }, type: { name: 'Monstrosity', key: 'monstrosity' }, size: { name: 'Medium', key: 'medium' }, challenge_rating: 2, armor_class: 12, hit_points: 55, hit_dice: '10d8+10', speed: { walk: 15, climb: 15, unit: 'feet' }, alignment: 'unaligned', passive_perception: 10 },
    ] }}/>)

    const preview = screen.getByRole('region', { name: 'Open5e Monster Search' })
    expect(preview).toHaveAttribute('data-preview-layout', 'monster-statblock')
    expect(preview).toHaveAttribute('data-ssot-fallback', 'false')
    const card = preview.querySelector('.open5e-monster-preview')
    expect(card).toHaveAttribute('data-api-version', 'v2')
    expect(card).toHaveAttribute('data-provider-total', '2')
    expect(card).toHaveAttribute('data-primary-monster-key', 'srd-2024_mimic')
    expect(card).toHaveAttribute('data-primary-source', 'System Reference Document 5.2')
    expect(preview).toHaveTextContent('CR 2')
    expect(preview).toHaveTextContent('Armor class')
    expect(preview).toHaveTextContent('58')
    expect(preview).toHaveTextContent('walk 20 feet')
    expect(preview).toHaveTextContent('System Reference Document 5.2')
    expect(preview).toHaveTextContent('Dungeons & Dragons 5e 2024')
    expect(preview).not.toHaveTextContent('Open5e Monster Search record 1')
  })
})
