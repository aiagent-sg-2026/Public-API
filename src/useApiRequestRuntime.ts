import { useCallback, useEffect, useRef, useState } from 'react'
import { validateParameters, type ApiDemo } from './apiCatalog'

export type RequestErrorKind = 'rate-limit' | 'provider-unavailable' | 'http-error' | 'network-or-cors' | 'timeout' | 'invalid-response' | 'unknown'

export const REQUEST_TIMEOUT_MS = 20_000

export type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: unknown; httpStatus: number; elapsed: number; size: number; url: string; runId: number }
  | { status: 'error'; message: string; url: string; errorType: RequestErrorKind; httpStatus?: number }

type RequestRuntimeOptions = {
  onRunStart: (api: ApiDemo, parameters: Record<string, string>) => void
  preloadResponsePreview?: () => unknown
}

async function fetchApi(api: ApiDemo, parameters: Record<string, string>, signal?: AbortSignal) {
  const url = api.buildUrl(parameters)
  const method = api.method ?? 'GET'
  const body = api.buildBody?.(parameters)
  const isForm = api.bodyEncoding === 'form'
  const started = performance.now()
  const requestHeaders = {
    Accept: 'application/json',
    ...(api.headers ?? {}),
    ...(body === undefined ? {} : { 'Content-Type': isForm ? 'application/x-www-form-urlencoded' : 'application/json' }),
  }
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    signal,
    ...(body === undefined ? {} : { body: isForm ? new URLSearchParams(body as Record<string, string>).toString() : JSON.stringify(body) }),
  })
  const text = await response.text()
  if (!response.ok) {
    const error = new Error(`The API returned ${response.status} ${response.statusText}.`) as Error & { httpStatus: number; errorType: RequestErrorKind }
    error.httpStatus = response.status
    error.errorType = response.status === 429 ? 'rate-limit' : response.status >= 500 ? 'provider-unavailable' : 'http-error'
    throw error
  }
  let data: unknown
  try {
    data = api.parseResponse ? api.parseResponse(text) : JSON.parse(text) as unknown
  } catch (cause) {
    const error = new Error('The API returned a successful HTTP response that could not be parsed as expected.', { cause }) as Error & { httpStatus: number; errorType: RequestErrorKind }
    error.httpStatus = response.status
    error.errorType = 'invalid-response'
    throw error
  }
  return { data, httpStatus: response.status, elapsed: Math.round(performance.now() - started), size: new Blob([text]).size, url }
}

const classifyRequestError = (error: unknown, abortReason?: unknown): { message: string; errorType: RequestErrorKind; httpStatus?: number } => {
  const candidate = typeof error === 'object' && error !== null
    ? error as { name?: string; message?: string; httpStatus?: number; errorType?: RequestErrorKind }
    : undefined
  const reasonCandidate = typeof abortReason === 'object' && abortReason !== null
    ? abortReason as { name?: string }
    : undefined
  const httpStatus = candidate?.httpStatus
  const isTimeout = candidate?.name === 'TimeoutError' || reasonCandidate?.name === 'TimeoutError'
  const errorType = candidate?.errorType
    ?? (isTimeout ? 'timeout' : error instanceof TypeError ? 'network-or-cors' : 'unknown')
  const message = isTimeout ? `The request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.` : candidate?.message ?? 'The request failed.'
  return { message, errorType, ...(httpStatus === undefined ? {} : { httpStatus }) }
}

export function useApiRequestRuntime({ onRunStart, preloadResponsePreview }: RequestRuntimeOptions) {
  const [request, setRequest] = useState<RequestState>({ status: 'idle' })
  const requestRunIdRef = useRef(0)
  const requestAbortRef = useRef<AbortController | null>(null)

  const cancelActiveRequest = useCallback(() => {
    requestRunIdRef.current += 1
    requestAbortRef.current?.abort(new DOMException('Request superseded.', 'AbortError'))
    requestAbortRef.current = null
  }, [])

  const resetRequest = useCallback(() => {
    setRequest({ status: 'idle' })
  }, [])

  const runRequest = useCallback(async (api: ApiDemo, values: Record<string, string>) => {
    const nextErrors = validateParameters(api, values)
    if (Object.keys(nextErrors).length) throw new Error(Object.values(nextErrors).join(' '))
    cancelActiveRequest()
    const runId = requestRunIdRef.current
    const controller = new AbortController()
    requestAbortRef.current = controller
    const timeoutId = window.setTimeout(() => {
      controller.abort(new DOMException('Request timed out.', 'TimeoutError'))
    }, REQUEST_TIMEOUT_MS)
    onRunStart(api, values)
    setRequest({ status: 'loading' })
    void preloadResponsePreview?.()
    try {
      const result = await fetchApi(api, values, controller.signal)
      if (runId === requestRunIdRef.current) setRequest({ status: 'success', ...result, runId })
      return result.data
    } catch (error) {
      if (runId === requestRunIdRef.current) {
        const classified = classifyRequestError(error, controller.signal.reason)
        setRequest({ status: 'error', ...classified, url: api.buildUrl(values) })
      }
      throw error
    } finally {
      window.clearTimeout(timeoutId)
      if (requestAbortRef.current === controller) requestAbortRef.current = null
    }
  }, [cancelActiveRequest, onRunStart, preloadResponsePreview])

  useEffect(() => () => cancelActiveRequest(), [cancelActiveRequest])

  return { request, runRequest, cancelActiveRequest, resetRequest }
}
