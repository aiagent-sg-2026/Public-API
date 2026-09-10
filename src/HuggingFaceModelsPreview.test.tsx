import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'models-dev')
if (!api) throw new Error('Missing Hugging Face model fixture')

describe('Hugging Face model-search semantic preview', () => {
  afterEach(cleanup)

  it('preserves model identity, access, provider license tag, popularity, and update metadata', () => {
    render(<ResponseDemoPreview api={api} data={[
      {
        id: 'openai-community/gpt2', author: 'openai-community', gated: false, private: false,
        pipeline_tag: 'text-generation', library_name: 'transformers', downloads: 14_748_356, likes: 3_743,
        lastModified: '2024-02-19T10:57:45.000Z', tags: ['transformers', 'text-generation', 'license:mit', 'en'],
      },
      {
        id: 'example/gated-model', author: 'example', gated: 'manual', private: false,
        pipeline_tag: 'text-classification', library_name: 'transformers', downloads: 42, likes: 3,
        lastModified: '2026-09-01T00:00:00Z', tags: ['license:apache-2.0'],
      },
    ]}/>)

    const preview = screen.getByRole('region', { name: 'Hugging Face Model Search' })
    expect(preview).toHaveAttribute('data-preview-layout', 'ai-model-catalog')
    expect(preview).toHaveAttribute('data-ssot-fallback', 'false')
    const card = preview.querySelector('.huggingface-models-preview')
    expect(card).toHaveAttribute('data-row-count', '2')
    expect(card).toHaveAttribute('data-primary-model-id', 'openai-community/gpt2')
    expect(card).toHaveAttribute('data-primary-access', 'Public')
    expect(card).toHaveAttribute('data-primary-license', 'mit')
    expect(preview).toHaveTextContent('openai-community/gpt2')
    expect(preview).toHaveTextContent('text-generation')
    expect(preview).toHaveTextContent('transformers')
    expect(preview).toHaveTextContent('14,748,356')
    expect(preview).toHaveTextContent('2024-02-19')
    expect(preview).toHaveTextContent('Gated · manual')
    expect(preview).toHaveTextContent('apache-2.0')
    expect(preview).not.toHaveTextContent('Hugging Face Model Search record 1')
  })
})
