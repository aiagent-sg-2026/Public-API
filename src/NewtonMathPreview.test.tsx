import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'newton-math-solver')
if (!api) throw new Error('Missing Newton fixture')

describe('Newton symbolic math provider contract and semantic preview', () => {
  afterEach(cleanup)

  it('uses the current Vercel deployment directly with the documented V2 path contract', () => {
    const url = new URL(api.buildUrl({ operation: 'simplify', expression: '2x+2x' }))
    expect(url.hostname).toBe('newton.vercel.app')
    expect(url.pathname).toBe('/api/v2/simplify/2x%2B2x')
    expect(api.risk).toBe('Review')
    expect(api.usageNote).toContain('community-maintained')
    expect(api.usageNote).toContain('Vercel')
  })

  it('maps provider operation, expression and result into dedicated symbolic-math semantics', () => {
    render(<ResponseDemoPreview api={api} data={{ operation: 'simplify', expression: '2x+2x', result: '4 x' }}/>)
    const preview = screen.getByRole('region', { name: 'Newton Math Solver' })
    expect(preview).toHaveAttribute('data-preview-layout', 'symbolic-math')
    expect(preview).toHaveAttribute('data-ssot-fallback', 'false')
    const card = preview.querySelector('.newton-math-preview')
    expect(card).toHaveAttribute('data-operation', 'simplify')
    expect(card).toHaveAttribute('data-expression', '2x+2x')
    expect(card).toHaveAttribute('data-result', '4 x')
    expect(preview).toHaveTextContent('Simplify result')
    expect(preview).toHaveTextContent('Input expression')
    expect(preview).toHaveTextContent('4 x')
  })

  it('keeps zeroes as a bounded symbolic result instead of a generic record dump', () => {
    render(<ResponseDemoPreview api={api} data={{ operation: 'zeroes', expression: 'x^2+2x', result: [-2, 0] }}/>)
    const preview = screen.getByRole('region', { name: 'Newton Math Solver' })
    expect(preview).toHaveTextContent('Find zeroes result')
    expect(preview).toHaveTextContent('-2, 0')
    expect(preview).toHaveTextContent('Zeroes returned')
    expect(preview).toHaveTextContent('2')
    expect(preview).not.toHaveTextContent('Newton Math Solver record 1')
  })
})
