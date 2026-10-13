import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetch } from 'undici'
import type { Logger } from '@/types.js'

import { request } from '@/actions/shared/api-request.js'

vi.mock('undici', async (importOriginal) => {
  const actual = await importOriginal<typeof import('undici')>()

  return {
    ...actual,
    fetch: vi.fn(),
  }
})

type FetchResponse = Awaited<ReturnType<typeof fetch>>

const fetchMock = vi.mocked(fetch)
const logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} as unknown as Logger
const url = new URL('https://api.example.test/resources')

const jsonResponse = (status: number, body: unknown): FetchResponse =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as FetchResponse

describe('request', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.mocked(logger.info).mockReset()
    vi.mocked(logger.warn).mockReset()
    vi.mocked(logger.error).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns arbitrary JSON payloads and defaults to GET', async () => {
    const payload = [{ id: 'resource-1' }]
    fetchMock.mockResolvedValueOnce(jsonResponse(200, payload))

    const result = await request<typeof payload>(url, {
      fetchOptions: { headers: { Accept: 'application/json' } },
      logger,
    })

    expect(result).toEqual(payload)
    expect(fetchMock).toHaveBeenCalledOnce()

    const [requestUrl, requestInit] = fetchMock.mock.calls[0]
    expect(requestUrl).toBe(url.toString())
    expect(requestInit).toMatchObject({
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    expect(requestInit?.signal).toBeInstanceOf(AbortSignal)
  })

  it('throws a structured error containing errors from a failed response', async () => {
    const errors = [{ status: '400', detail: 'Invalid request' }]
    fetchMock.mockResolvedValueOnce(jsonResponse(400, { errors }))

    const result = request(url, {
      fetchOptions: { method: 'POST' },
      logger,
      maxRetries: 2,
    })

    await expect(result).rejects.toMatchObject({
      name: 'ExternalApiError',
      status: 400,
      errors,
    })
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(logger.error).toHaveBeenCalledOnce()
  })

  it('uses an empty error list when a failed response is not valid JSON', async () => {
    fetchMock.mockResolvedValueOnce({
      ...jsonResponse(502, {}),
      json: vi.fn().mockRejectedValue(new SyntaxError('Invalid JSON')),
    } as unknown as FetchResponse)

    const result = request(url, {
      fetchOptions: { method: 'POST' },
      logger,
    })

    await expect(result).rejects.toEqual(expect.objectContaining({ status: 502, errors: [] }))
  })

  it('rejects a successful response that contains API errors', async () => {
    const errors = [{ title: 'Partial failure' }]
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: null, errors }))

    await expect(request(url, { logger })).rejects.toEqual(
      expect.objectContaining({
        status: 200,
        errors,
      }),
    )
  })

  it('retries a retryable response for a safe method', async () => {
    vi.useFakeTimers()
    fetchMock
      .mockResolvedValueOnce(jsonResponse(503, { errors: [{ title: 'Unavailable' }] }))
      .mockResolvedValueOnce(jsonResponse(200, { data: [] }))

    const result = request(url, {
      fetchOptions: { method: 'GET' },
      logger,
      maxRetries: 2,
    })
    await vi.runAllTimersAsync()

    await expect(result).resolves.toEqual({ data: [] })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ attempt: 1, maxAttempts: 2, delay: 1000 }),
      'Retrying API request',
    )
  })

  it('retries transient transport errors for case-insensitive safe methods', async () => {
    vi.useFakeTimers()
    const cause = Object.assign(new Error('socket closed'), { code: 'UND_ERR_SOCKET' })
    fetchMock
      .mockRejectedValueOnce(new TypeError('fetch failed', { cause }))
      .mockResolvedValueOnce(jsonResponse(200, { data: [] }))

    const result = request(url, {
      fetchOptions: { method: 'get' },
      logger,
      maxRetries: 2,
    })
    await vi.runAllTimersAsync()

    await expect(result).resolves.toEqual({ data: [] })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('wraps a final timeout with its cause', async () => {
    const timeout = new DOMException('The operation was aborted due to timeout', 'TimeoutError')
    fetchMock.mockRejectedValueOnce(timeout)

    await expect(request(url, { logger })).rejects.toMatchObject({
      message: 'API request timed out',
      cause: timeout,
    })
  })

  it('preserves explicit cancellation', async () => {
    const cancellation = new DOMException('This operation was aborted', 'AbortError')
    fetchMock.mockRejectedValueOnce(cancellation)

    await expect(request(url, { logger })).rejects.toBe(cancellation)
    expect(logger.info).toHaveBeenCalledWith({ method: 'GET', url: url.toString() }, 'API request aborted')
  })

  it('identifies an invalid successful JSON response', async () => {
    const syntaxError = new SyntaxError('Unexpected end of JSON input')
    fetchMock.mockResolvedValueOnce({
      ...jsonResponse(200, {}),
      json: vi.fn().mockRejectedValue(syntaxError),
    } as unknown as FetchResponse)

    await expect(request(url, { logger })).rejects.toMatchObject({
      message: 'API returned an invalid JSON response',
      cause: syntaxError,
    })
  })

  it('wraps non-transient transport errors', async () => {
    const transportError = new TypeError('Invalid request options')
    fetchMock.mockRejectedValueOnce(transportError)

    await expect(request(url, { logger })).rejects.toMatchObject({
      message: 'API transport error',
      cause: transportError,
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('logs and preserves unexpected errors', async () => {
    const unexpectedError = new Error('Unexpected failure')
    fetchMock.mockRejectedValueOnce(unexpectedError)

    await expect(request(url, { logger })).rejects.toBe(unexpectedError)
    expect(logger.error).toHaveBeenCalledWith(
      {
        err: unexpectedError,
        method: 'GET',
        url: url.toString(),
      },
      'Unexpected API error',
    )
  })

  it('delegates successful response parsing without consuming the body first', async () => {
    const response = jsonResponse(200, { access_token: 'access-token' })
    const parseResponse = vi.fn(async (rawResponse: Response) => {
      const payload = (await rawResponse.json()) as { access_token: string }

      return { accessToken: payload.access_token }
    })
    fetchMock.mockResolvedValueOnce(response)

    const result = await request(url, { logger, parseResponse })

    expect(result).toEqual({ accessToken: 'access-token' })
    expect(parseResponse).toHaveBeenCalledWith(response)
    expect(response.json).toHaveBeenCalledOnce()
  })
})
