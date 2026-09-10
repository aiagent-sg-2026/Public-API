import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'un-sdg-goals')
if (!api) throw new Error('Missing un-sdg-goals fixture')

describe('UN SDG goals semantic preview', () => {
  afterEach(cleanup)
  it('preserves goal identity, descriptions, and API paths', () => {
    render(<ResponseDemoPreview api={api} data={[{ code: '1', title: 'End poverty in all its forms everywhere', description: 'Goal one description.', uri: '/v1/sdg/Goal/1' }, { code: '2', title: 'End hunger', description: 'Goal two description.', uri: '/v1/sdg/Goal/2' }]}/>)
    const preview = screen.getByRole('region', { name: 'UN Sustainable Development Goals' })
    expect(preview).toHaveAttribute('data-preview-layout', 'sdg-goals')
    expect(preview.querySelector('.sdg-goals-preview')).toHaveAttribute('data-goal-count', '2')
    expect(preview.querySelector('[data-goal-code="1"]')).toHaveAttribute('data-goal-uri', '/v1/sdg/Goal/1')
    expect(preview).toHaveTextContent('Goal one description.')
    expect(screen.getByLabelText('Goal 1 API path')).toHaveTextContent('/v1/sdg/Goal/1')
    expect(preview).toHaveTextContent('Targets, indicators, series and observations are separate')
  })
})
