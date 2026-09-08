import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'rxnorm-drug-search')
if (!api) throw new Error('Missing rxnorm-drug-search fixture')

describe('RxNorm drug terminology semantic preview', () => {
  afterEach(cleanup)

  it('groups standardized concepts by RxNorm term type and exposes stable RxCUI metadata', () => {
    render(<ResponseDemoPreview
      api={api}
      requestUrl="https://rxnav.nlm.nih.gov/REST/drugs.json?name=ibuprofen"
      data={{ drugGroup: { name: null, conceptGroup: [
        { tty: 'SBD', conceptProperties: [
          { rxcui: '153008', name: 'ibuprofen 200 MG Oral Tablet [Advil]', synonym: 'Advil 200 MG Oral Tablet', tty: 'SBD' },
        ] },
        { tty: 'SCD', conceptProperties: [
          { rxcui: '197805', name: 'ibuprofen 400 MG Oral Tablet', synonym: '', tty: 'SCD' },
          { rxcui: '310965', name: 'ibuprofen 200 MG Oral Tablet', synonym: 'ibuprofen 200 MG (as ibuprofen sodium 256 MG) Oral Tablet', tty: 'SCD' },
        ] },
      ] } }}
    />)

    const preview = screen.getByRole('region', { name: 'RxNorm Drug Search' })
    expect(preview).toHaveAttribute('data-preview-layout', 'drug-terminology')
    const terminology = preview.querySelector('.rxnorm-preview')
    expect(terminology).toHaveAttribute('data-query-name', 'ibuprofen')
    expect(terminology).toHaveAttribute('data-result-count', '3')
    expect(terminology).toHaveAttribute('data-term-types', 'SBD,SCD')
    expect(terminology).toHaveAttribute('data-primary-rxcui', '197805')
    expect(terminology).toHaveAttribute('data-primary-concept-name', 'ibuprofen 400 MG Oral Tablet')
    expect(terminology).toHaveAttribute('data-primary-term-type', 'SCD')
    expect(within(preview).getByRole('heading', { name: 'ibuprofen' })).toBeInTheDocument()
    expect(within(preview).getByRole('heading', { name: 'Clinical Drug' })).toBeInTheDocument()
    expect(within(preview).getByRole('heading', { name: 'Branded Drug' })).toBeInTheDocument()
    expect(preview).toHaveTextContent('RxCUI 197805')
    expect(preview).toHaveTextContent('Advil 200 MG Oral Tablet')
    expect(preview).not.toHaveTextContent('RxNorm Drug Search record 1')
    expect(preview).not.toHaveTextContent('properties')
  })
})
