import type { Logger } from '@/types.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetch } from 'undici'

import { OxeClient } from '@/actions/openxeco/utils/openxeco-client.js'

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
const credentials = {
  email: 'user@example.test',
  password: 'secret',
}

const response = (status: number, body: unknown, setCookies: string[] = []): FetchResponse =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      getSetCookie: vi.fn().mockReturnValue(setCookies),
    },
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as FetchResponse

describe('OxeClient', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('authenticates before GET and sends both authentication cookies', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(200, {}, [
          'access_token_cookie=access-token; Path=/; HttpOnly',
          'refresh_token_cookie=refresh-token; Path=/; HttpOnly',
        ]),
      )
      .mockResolvedValueOnce(response(200, [{ id: 1 }]))
    const client = new OxeClient({ baseUrl: 'https://openxeco.example.test/api' }, credentials, logger)

    const result = await client.get<Array<{ id: number }>>('/form/get_form_answers', {
      form_id: 11,
      active: true,
      omitted: undefined,
    })

    expect(result).toEqual([{ id: 1 }])
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const [loginUrl, loginInit] = fetchMock.mock.calls[0]
    expect(loginUrl).toBe('https://openxeco.example.test/api/account/login')
    expect(loginInit).toMatchObject({
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    const [requestUrl, requestInit] = fetchMock.mock.calls[1]
    const url = new URL(String(requestUrl))
    const headers = requestInit?.headers as Record<string, string>

    expect(url.pathname).toBe('/api/form/get_form_answers')
    expect(url.searchParams.get('form_id')).toBe('11')
    expect(url.searchParams.get('active')).toBe('true')
    expect(url.searchParams.has('omitted')).toBe(false)
    expect(requestInit?.method).toBe('GET')
    expect(headers.Authorization).toBe('Bearer access-token')
    expect(headers.Cookie).toBe('access_token_cookie=access-token; refresh_token_cookie=refresh-token')
  })

  it('uses login tokens from the response body and sends an authenticated POST', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(200, {
          access_token: 'body-access-token',
          refresh_token: 'body-refresh-token',
        }),
      )
      .mockResolvedValueOnce(response(200, { id: 42 }))
    const client = new OxeClient({ baseUrl: 'https://openxeco.example.test' }, credentials, logger)

    const result = await client.post<{ id: number }>('/resource', {
      body: { name: 'Resource' },
      params: { notify: false },
    })

    expect(result).toEqual({ id: 42 })

    const [requestUrl, requestInit] = fetchMock.mock.calls[1]
    const headers = requestInit?.headers as Record<string, string>

    expect(requestUrl).toBe('https://openxeco.example.test/resource?notify=false')
    expect(requestInit?.method).toBe('POST')
    expect(requestInit?.body).toBe('{"name":"Resource"}')
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers.Authorization).toBe('Bearer body-access-token')
    expect(headers.Cookie).toBe('access_token_cookie=body-access-token; refresh_token_cookie=body-refresh-token')
  })

  it('reuses the authenticated session across requests', async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, {}, ['access_token_cookie=access-token; Path=/']))
      .mockResolvedValueOnce(response(200, { first: true }))
      .mockResolvedValueOnce(response(200, { second: true }))
    const client = new OxeClient({ baseUrl: 'https://openxeco.example.test' }, credentials, logger)

    await client.get('/first')
    await client.get('/second')

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/account/login'))).toHaveLength(1)
  })

  it('shares one login between concurrent requests', async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, {}, ['access_token_cookie=access-token; Path=/']))
      .mockResolvedValueOnce(response(200, { first: true }))
      .mockResolvedValueOnce(response(200, { second: true }))
    const client = new OxeClient({ baseUrl: 'https://openxeco.example.test' }, credentials, logger)

    await Promise.all([client.get('/first'), client.get('/second')])

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/account/login'))).toHaveLength(1)
  })

  it('maps rejected login credentials to OxeAuthenticationError', async () => {
    fetchMock.mockResolvedValueOnce(response(401, {}))
    const client = new OxeClient({ baseUrl: 'https://openxeco.example.test' }, credentials, logger)

    await expect(client.get('/resource')).rejects.toMatchObject({
      name: 'OxeAuthenticationError',
      status: 401,
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('maps authenticated API failures to OxeApiError', async () => {
    const errors = [{ detail: 'Form not found' }]
    fetchMock
      .mockResolvedValueOnce(response(200, {}, ['access_token_cookie=access-token; Path=/']))
      .mockResolvedValueOnce(response(422, { errors }))
    const client = new OxeClient({ baseUrl: 'https://openxeco.example.test' }, credentials, logger)

    await expect(client.get('/form')).rejects.toMatchObject({
      name: 'OxeApiError',
      status: 422,
      errors,
    })
  })

  it('rejects a successful login response without an access token', async () => {
    fetchMock.mockResolvedValueOnce(response(200, { user_id: 123 }))
    const client = new OxeClient({ baseUrl: 'https://openxeco.example.test' }, credentials, logger)

    await expect(client.get('/resource')).rejects.toMatchObject({
      name: 'OxeApiError',
      status: 502,
      message: 'Login succeeded but no authentication token was returned.',
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
