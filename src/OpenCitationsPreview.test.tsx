import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'opencitations-index')
if (!api) throw new Error('Missing opencitations-index fixture')

describe('OpenCitations semantic preview', () => {
  afterEach(cleanup)

  it('binds the provider citation count to the DOI from the request URL', () => {
    render(<ResponseDemoPreview api={api} data={[{ count: '98' }]} requestUrl="https://api.opencitations.net/index/v2/citation-count/doi:10.1109%2F5.771073"/>)
    const preview = screen.getByRole('region', { name: 'OpenCitations Citation Count' })
    expect(preview).toHaveAttribute('data-preview-layout', 'citation-count')
    const card = preview.querySelector('.opencitations-preview')
    expect(card).toHaveAttribute('data-primary-doi', '10.1109/5.771073')
    expect(card).toHaveAttribute('data-incoming-citation-count', '98')
    expect(preview).toHaveTextContent('98 incoming citations')
    expect(preview).toHaveTextContent('10.1109/5.771073')
    expect(preview).toHaveTextContent('Incoming / cited by other works')
    expect(preview).not.toHaveTextContent('OpenCitations Citation Count record 1')
  })
})
