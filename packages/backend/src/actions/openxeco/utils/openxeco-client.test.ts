import type { Logger } from '@/types.js'
import type { Response } from 'undici'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { OxeSession } from '@/actions/openxeco/types.js'
import { OxeClient } from '@/actions/openxeco/utils/openxeco-client.js'
import { ExternalApiError } from '@/actions/shared/api-error.js'
import { request } from '@/actions/shared/api-request.js'
import type { ExternalApiRequestOptions } from '@/actions/shared/types.js'

vi.mock('@/actions/shared/api-request.js', () => ({
  request: vi.fn(),
}))

const requestMock = vi.mocked(request)
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

const response = (body: unknown, setCookies: string[] = []): Response =>
  ({
    headers: {
      getSetCookie: vi.fn().mockReturnValue(setCookies),
    },
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as Response

const mockLoginResponse = (body: unknown, setCookies: string[] = []): void => {
  requestMock.mockImplementationOnce(async <R>(_url: URL, options: ExternalApiRequestOptions<R>): Promise<R> => {
    if (!options.parseResponse) {
      throw new Error('Expected the login request to provide a response parser')
    }

    return await options.parseResponse(response(body, setCookies))
  })
}

const session: OxeSession = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
}

describe('OxeClient', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('sends credentials to the login endpoint', async () => {
    mockLoginResponse({}, ['access_token_cookie=access-token; Path=/'])
    const client = new OxeClient({ baseUrl: new URL('https://openxeco.example.test/api/') }, logger)

    await client.login(credentials)

    expect(requestMock).toHaveBeenCalledOnce()
    const [loginUrl, loginOptions] = requestMock.mock.calls[0]
    expect(loginUrl.toString()).toBe('https://openxeco.example.test/api/account/login')
    expect(loginOptions.fetchOptions).toMatchObject({
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('extracts access and refresh tokens from login cookies', async () => {
    mockLoginResponse({}, [
      'access_token_cookie=access-token; Path=/; HttpOnly',
      'refresh_token_cookie=refresh-token; Path=/; HttpOnly',
    ])
    const client = new OxeClient({ baseUrl: new URL('https://openxeco.example.test/') }, logger)

    await expect(client.login(credentials)).resolves.toEqual(session)
  })

  it('extracts access and refresh tokens from the login response body', async () => {
    mockLoginResponse({ access_token: 'body-access-token', refresh_token: 'body-refresh-token' })
    const client = new OxeClient({ baseUrl: new URL('https://openxeco.example.test/') }, logger)

    await expect(client.login(credentials)).resolves.toEqual({
      accessToken: 'body-access-token',
      refreshToken: 'body-refresh-token',
    })
  })

  it('sends the supplied session tokens in authenticated requests without logging in', async () => {
    requestMock.mockResolvedValueOnce({ id: 1 })
    const client = new OxeClient({ baseUrl: new URL('https://openxeco.example.test/') }, logger)

    await client.get(session, '/resource')

    expect(requestMock).toHaveBeenCalledOnce()
    const [url, options] = requestMock.mock.calls[0]
    expect(url.pathname).toBe('/resource')
    expect(options.fetchOptions).toMatchObject({
      method: 'GET',
      headers: {
        Authorization: 'Bearer access-token',
        Cookie: 'access_token_cookie=access-token; refresh_token_cookie=refresh-token',
      },
    })
  })

  it('omits the refresh cookie when the supplied session has no refresh token', async () => {
    requestMock.mockResolvedValueOnce({ id: 1 })
    const client = new OxeClient({ baseUrl: new URL('https://openxeco.example.test/') }, logger)

    await client.get({ accessToken: 'access-only' }, '/resource')

    expect(requestMock.mock.calls[0][1].fetchOptions?.headers).toMatchObject({
      Cookie: 'access_token_cookie=access-only',
    })
  })

  it('uses each supplied session independently for concurrent requests on the same client', async () => {
    requestMock.mockResolvedValue({ id: 1 })
    const client = new OxeClient({ baseUrl: new URL('https://openxeco.example.test/') }, logger)
    const otherSession = { accessToken: 'other-access', refreshToken: 'other-refresh' }

    await Promise.all([client.get(session, '/first'), client.get(otherSession, '/second')])

    expect(requestMock).toHaveBeenCalledTimes(2)
    expect(requestMock.mock.calls[0][1].fetchOptions?.headers).toMatchObject({
      Authorization: 'Bearer access-token',
      Cookie: 'access_token_cookie=access-token; refresh_token_cookie=refresh-token',
    })
    expect(requestMock.mock.calls[1][1].fetchOptions?.headers).toMatchObject({
      Authorization: 'Bearer other-access',
      Cookie: 'access_token_cookie=other-access; refresh_token_cookie=other-refresh',
    })
  })

  it('serializes false query parameters and omits nullish values', async () => {
    requestMock.mockResolvedValueOnce({ id: 1 })
    const client = new OxeClient({ baseUrl: new URL('https://openxeco.example.test/api/') }, logger)

    await client.get(session, '/form/get_form_answers', {
      form_id: 11,
      active: false,
      omitted: undefined,
      empty: null,
    })

    const [requestUrl] = requestMock.mock.calls[0]
    expect(requestUrl.pathname).toBe('/api/form/get_form_answers')
    expect(requestUrl.searchParams.get('form_id')).toBe('11')
    expect(requestUrl.searchParams.get('active')).toBe('false')
    expect(requestUrl.searchParams.has('omitted')).toBe(false)
    expect(requestUrl.searchParams.has('empty')).toBe(false)
  })

  it('sends a JSON body in POST requests', async () => {
    requestMock.mockResolvedValueOnce({ id: 42 })
    const client = new OxeClient({ baseUrl: new URL('https://openxeco.example.test/') }, logger)
    const body = { name: 'Resource' }

    const result = await client.post<{ id: number }>(session, '/resource', { body })

    expect(result).toEqual({ id: 42 })
    const [requestUrl, requestOptions] = requestMock.mock.calls[0]
    const headers = requestOptions.fetchOptions?.headers as Record<string, string>
    expect(requestUrl.toString()).toBe('https://openxeco.example.test/resource')
    expect(requestOptions.fetchOptions?.method).toBe('POST')
    expect(requestOptions.fetchOptions?.body).toBe(JSON.stringify(body))
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('forwards the configured timeout and requested retry count', async () => {
    requestMock.mockResolvedValueOnce({ id: 1 })
    const client = new OxeClient({ baseUrl: new URL('https://openxeco.example.test/'), timeout: 5000 }, logger)

    await client.get(session, '/resource', undefined, 3)

    const [, requestOptions] = requestMock.mock.calls[0]
    expect(requestOptions.timeout).toBe(5000)
    expect(requestOptions.maxRetries).toBe(3)
  })

  it('maps rejected login credentials to OxeAuthenticationError', async () => {
    requestMock.mockRejectedValueOnce(new ExternalApiError('API Error', 401, []))
    const client = new OxeClient({ baseUrl: new URL('https://openxeco.example.test/') }, logger)

    await expect(client.login(credentials)).rejects.toMatchObject({
      name: 'OxeAuthenticationError',
      status: 401,
    })
  })

  it('maps authenticated API failures to OxeApiError', async () => {
    const errors = [{ detail: 'Form not found' }]
    requestMock.mockRejectedValueOnce(new ExternalApiError('API Error', 422, errors))
    const client = new OxeClient({ baseUrl: new URL('https://openxeco.example.test/') }, logger)

    await expect(client.get(session, '/form')).rejects.toMatchObject({
      name: 'OxeApiError',
      status: 422,
      errors,
    })
  })

  it('rejects a successful login response without an access token', async () => {
    mockLoginResponse({ user_id: 123 })
    const client = new OxeClient({ baseUrl: new URL('https://openxeco.example.test/') }, logger)

    await expect(client.login(credentials)).rejects.toMatchObject({
      name: 'OxeApiError',
      status: 502,
      message: 'Login succeeded but no authentication token was returned.',
    })
  })
})
