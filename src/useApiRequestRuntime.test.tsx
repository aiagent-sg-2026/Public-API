import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getApiById, getDefaultParameters, type ApiDemo } from './apiCatalog'
import { REQUEST_TIMEOUT_MS, useApiRequestRuntime } from './useApiRequestRuntime'

const api = (id: string): ApiDemo => {
  const match = getApiById(id)
  if (!match) throw new Error(`Missing test API: ${id}`)
  return match
}

type HarnessProps = {
  api: ApiDemo
  values?: Record<string, string>
  onRunStart?: (api: ApiDemo, values: Record<string, string>) => void
}

function RuntimeHarness({ api: activeApi, values = getDefaultParameters(activeApi), onRunStart = () => undefined }: HarnessProps) {
  const { request, runRequest, cancelActiveRequest } = useApiRequestRuntime({ onRunStart })

  return (
    <section>
      <button type="button" onClick={() => void runRequest(activeApi, values).catch(() => undefined)}>Run request</button>
      <button type="button" onClick={cancelActiveRequest}>Cancel request</button>
      <output
        data-testid="request-state"
        data-status={request.status}
        data-error-type={request.status === 'error' ? request.errorType : undefined}
        data-http-status={request.status === 'success' || request.status === 'error' ? request.httpStatus : undefined}
        data-run-id={request.status === 'success' ? request.runId : undefined}
        data-request-method={request.status === 'success' ? request.executedRequest.method : undefined}
        data-request-url={request.status === 'success' ? request.executedRequest.url : undefined}
        data-request-body={request.status === 'success' && request.executedRequest.body !== undefined ? JSON.stringify(request.executedRequest.body) : undefined}
      >
        {request.status === 'success' ? JSON.stringify(request.data) : request.status === 'error' ? request.message : request.status}
      </output>
    </section>
  )
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useApiRequestRuntime', () => {
  it('owns the successful request lifecycle shared by Human UI and WebMCP', async () => {
    const countries = api('countries')
    const onRunStart = vi.fn()
    const payload = [{ page: 1 }, [{ id: 'SGP', name: 'Singapore' }]]
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    render(<RuntimeHarness api={countries} onRunStart={onRunStart} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run request' }))

    await waitFor(() => expect(screen.getByTestId('request-state')).toHaveAttribute('data-status', 'success'))
    expect(screen.getByTestId('request-state')).toHaveTextContent('Singapore')
    expect(screen.getByTestId('request-state')).toHaveAttribute('data-http-status', '200')
    expect(onRunStart).toHaveBeenCalledWith(countries, getDefaultParameters(countries))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('assigns a new success run ID even when a POST API keeps the same request URL', async () => {
    const aniList = api('anilist-graphql')
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ data: { Page: { pageInfo: {}, media: [] } } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })))
    vi.stubGlobal('fetch', fetchMock)

    const { rerender } = render(<RuntimeHarness api={aniList} values={{ query: 'One', mediaType: 'ANIME', page: '1', limit: '6' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run request' }))
    await waitFor(() => expect(screen.getByTestId('request-state')).toHaveAttribute('data-run-id', '1'))

    rerender(<RuntimeHarness api={aniList} values={{ query: 'Two', mediaType: 'ANIME', page: '1', limit: '6' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run request' }))
    await waitFor(() => expect(screen.getByTestId('request-state')).toHaveAttribute('data-run-id', '2'))

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(fetchMock.mock.calls[1]?.[0])
    const state = screen.getByTestId('request-state')
    expect(state).toHaveAttribute('data-request-method', 'POST')
    expect(state).toHaveAttribute('data-request-url', aniList.buildUrl({ query: 'Two', mediaType: 'ANIME', page: '1', limit: '6' }))
    const expectedBody = aniList.buildBody?.({ query: 'Two', mediaType: 'ANIME', page: '1', limit: '6' })
    expect(JSON.parse(state.getAttribute('data-request-body') ?? '{}')).toEqual(expectedBody)
    const secondInit = fetchMock.mock.calls[1]?.[1] as RequestInit | undefined
    expect(JSON.parse(String(secondInit?.body))).toEqual(expectedBody)
  })

  it('sends provider-identification headers from the shared API SSOT', async () => {
    const wikidata = api('wikidata-sparql')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ head: { vars: [] }, results: { bindings: [] } }), {
      status: 200,
      headers: { 'Content-Type': 'application/sparql-results+json' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    render(<RuntimeHarness api={wikidata} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run request' }))

    await waitFor(() => expect(screen.getByTestId('request-state')).toHaveAttribute('data-status', 'success'))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    expect(init?.headers).toMatchObject({
      Accept: 'application/sparql-results+json',
      'Api-User-Agent': 'Public-API/0.1 (https://yapweijun1996.github.io/Public-API/)',
    })
  })

  it('rejects invalid select input before any provider request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(<RuntimeHarness api={api('people')} values={{ count: '3', nationality: 'xx' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run request' }))

    await waitFor(() => expect(screen.getByTestId('request-state')).toHaveAttribute('data-status', 'idle'))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects blank, fractional, and out-of-range Art Institute inputs before provider execution', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const art = api('art-institute-search')
    const { rerender } = render(<RuntimeHarness api={art} values={{ query: '   ', limit: '8' }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Run request' }))
    await waitFor(() => expect(screen.getByTestId('request-state')).toHaveAttribute('data-status', 'idle'))
    rerender(<RuntimeHarness api={art} values={{ query: 'monet', limit: '2.5' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run request' }))
    await waitFor(() => expect(screen.getByTestId('request-state')).toHaveAttribute('data-status', 'idle'))
    rerender(<RuntimeHarness api={art} values={{ query: 'monet', limit: '21' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run request' }))
    await waitFor(() => expect(screen.getByTestId('request-state')).toHaveAttribute('data-status', 'idle'))

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('classifies browser fetch TypeError as network-or-cors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    render(<RuntimeHarness api={api('countries')} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run request' }))

    await waitFor(() => expect(screen.getByTestId('request-state')).toHaveAttribute('data-status', 'error'))
    expect(screen.getByTestId('request-state')).toHaveAttribute('data-error-type', 'network-or-cors')
    expect(screen.getByTestId('request-state')).toHaveTextContent('Failed to fetch')
  })

  it('fails closed when HTTP 2xx violates an ordinary JSON response contract', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>temporary provider page</html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    })))

    render(<RuntimeHarness api={api('countries')} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run request' }))

    await waitFor(() => expect(screen.getByTestId('request-state')).toHaveAttribute('data-status', 'error'))
    expect(screen.getByTestId('request-state')).toHaveAttribute('data-error-type', 'invalid-response')
    expect(screen.getByTestId('request-state')).toHaveAttribute('data-http-status', '200')
    expect(screen.getByTestId('request-state')).toHaveTextContent('could not be parsed as expected')
  })

  it('maps a provider-declared 204 no-content response to API-specific semantic empty data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    render(<RuntimeHarness api={api('worms-species-lookup')} values={{ name: 'DefinitelyNotARealMarineTaxonXYZ' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run request' }))

    await waitFor(() => expect(screen.getByTestId('request-state')).toHaveAttribute('data-status', 'success'))
    expect(screen.getByTestId('request-state')).toHaveAttribute('data-http-status', '204')
    expect(screen.getByTestId('request-state')).toHaveTextContent('[]')
  })

  it('keeps undeclared empty JSON success responses fail-closed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    render(<RuntimeHarness api={api('countries')} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run request' }))

    await waitFor(() => expect(screen.getByTestId('request-state')).toHaveAttribute('data-status', 'error'))
    expect(screen.getByTestId('request-state')).toHaveAttribute('data-error-type', 'invalid-response')
    expect(screen.getByTestId('request-state')).toHaveAttribute('data-http-status', '204')
  })

  it('classifies HTTP failure before invoking an explicit non-JSON response parser', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('temporary upstream failure', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' },
    })))

    render(<RuntimeHarness api={api('go-module-proxy')} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run request' }))

    await waitFor(() => expect(screen.getByTestId('request-state')).toHaveAttribute('data-status', 'error'))
    expect(screen.getByTestId('request-state')).toHaveAttribute('data-error-type', 'provider-unavailable')
    expect(screen.getByTestId('request-state')).toHaveAttribute('data-http-status', '503')
    expect(screen.getByTestId('request-state')).toHaveTextContent('503 Service Unavailable')
  })

  it('turns a stalled request into the deterministic 20-second timeout state', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn((_url: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal
      if (!signal) return reject(new Error('Missing AbortSignal'))
      signal.addEventListener('abort', () => reject(new DOMException('The user aborted a request.', 'AbortError')), { once: true })
    }))
    vi.stubGlobal('fetch', fetchMock)

    render(<RuntimeHarness api={api('countries')} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run request' }))
    expect(screen.getByTestId('request-state')).toHaveAttribute('data-status', 'loading')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS + 1)
    })

    expect(screen.getByTestId('request-state')).toHaveAttribute('data-status', 'error')
    expect(screen.getByTestId('request-state')).toHaveAttribute('data-error-type', 'timeout')
    expect(screen.getByTestId('request-state')).toHaveTextContent('The request timed out after 20 seconds.')
  })

  it('aborts a superseded request and prevents stale data from replacing the newer result', async () => {
    let firstSignal: AbortSignal | undefined
    const fetchMock = vi.fn((_url: RequestInfo | URL, init?: RequestInit) => {
      if (fetchMock.mock.calls.length === 1) {
        firstSignal = init?.signal ?? undefined
        return new Promise<Response>((_resolve, reject) => {
          firstSignal?.addEventListener('abort', () => reject(firstSignal?.reason ?? new DOMException('Aborted', 'AbortError')), { once: true })
        })
      }
      return Promise.resolve(new Response(JSON.stringify([{ page: 1 }, [{ id: 'MYS', name: 'Malaysia' }]]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    })
    vi.stubGlobal('fetch', fetchMock)
    const countries = api('countries')
    const { rerender } = render(<RuntimeHarness api={countries} values={{ code: 'SG' }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Run request' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    rerender(<RuntimeHarness api={countries} values={{ code: 'MY' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run request' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(firstSignal?.aborted).toBe(true)
    await waitFor(() => expect(screen.getByTestId('request-state')).toHaveAttribute('data-status', 'success'))
    expect(screen.getByTestId('request-state')).toHaveTextContent('Malaysia')
    expect(screen.getByTestId('request-state')).not.toHaveTextContent('Singapore')
  })

  it('aborts an active request when the owning UI unmounts', async () => {
    let signal: AbortSignal | undefined
    const fetchMock = vi.fn((_url: RequestInfo | URL, init?: RequestInit) => {
      signal = init?.signal ?? undefined
      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(signal?.reason ?? new DOMException('Aborted', 'AbortError')), { once: true })
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const { unmount } = render(<RuntimeHarness api={api('countries')} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run request' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    unmount()
    expect(signal?.aborted).toBe(true)
  })
})
