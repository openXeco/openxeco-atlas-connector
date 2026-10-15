import type { Env } from '@/types.js'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AtlasClient } from '@/actions/atlas/types.js'
import { makeLogger } from '@/actions/atlas/test-support/fakes.js'
import { ExternalApiError } from '@/actions/shared/api-error.js'
import { request } from '@/actions/shared/api-request.js'

vi.mock('@/actions/shared/api-request.js', () => ({
  request: vi.fn(),
}))

type Client = AtlasClient

const requestMock = vi.mocked(request)
const logger = makeLogger().logger

const appConfig: Env = {
  NODE_ENV: 'test',
  PORT: 3001,
  HOST: '127.0.0.1',
  DATABASE_URL: 'postgres://test:test@localhost:5432/test',
  JWT_SECRET: 'test-secret-that-is-at-least-32-characters',
  JWT_EXPIRES_IN: '5m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  ATLAS_BASE_URL: 'https://atlas.example/api',
  OXE_BASE_URL: 'https://openxeco.example.test/',
  ATLAS_API_KEY: 'atlas-api-key',
  ATLAS_USERNAME: 'atlas-user',
  ATLAS_PASSWORD: 'atlas-password',
}

describe('AtlasClient', () => {
  let client: Client

  beforeAll(async () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('DATABASE_URL', appConfig.DATABASE_URL)
    vi.stubEnv('JWT_SECRET', appConfig.JWT_SECRET)
    vi.stubEnv('ATLAS_BASE_URL', appConfig.ATLAS_BASE_URL)
    vi.stubEnv('ATLAS_API_KEY', appConfig.ATLAS_API_KEY)
    vi.stubEnv('ATLAS_USERNAME', appConfig.ATLAS_USERNAME ?? '')
    vi.stubEnv('ATLAS_PASSWORD', appConfig.ATLAS_PASSWORD ?? '')

    const { getAtlasClient } = await import('@/actions/atlas/utils/atlas-client.js')
    client = getAtlasClient({ appConfig, logger })
  })

  beforeEach(() => {
    requestMock.mockReset()
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  it('sends the API key and Basic authentication headers', async () => {
    requestMock.mockResolvedValueOnce({ data: [] })

    await client.get('/node/cluster')

    const [, requestOptions] = requestMock.mock.calls[0]
    const headers = requestOptions.fetchOptions?.headers as Record<string, string>
    expect(headers['api-key']).toBe('atlas-api-key')
    expect(headers.Authorization).toBe(`Basic ${Buffer.from('atlas-user:atlas-password').toString('base64')}`)
    expect(headers.Accept).toBe('application/vnd.api+json')
    expect(headers['Content-Type']).toBe('application/vnd.api+json')
  })

  it('serializes pagination, inclusion, sorting, and nested filter parameters', async () => {
    requestMock.mockResolvedValueOnce({ data: [] })

    await client.get('/node/cluster', {
      pageOffset: 0,
      pageLimit: 50,
      include: ['field_sectors', 'field_technologies'],
      sort: 'title',
      filter: {
        country: {
          path: 'field_country_code',
          operator: '=',
          value: 'LU',
        },
      },
    })

    const [requestUrl] = requestMock.mock.calls[0]
    expect(requestUrl.origin).toBe('https://atlas.example')
    expect(requestUrl.pathname).toBe('/api/node/cluster')
    expect(requestUrl.searchParams.get('page[offset]')).toBe('0')
    expect(requestUrl.searchParams.get('page[limit]')).toBe('50')
    expect(requestUrl.searchParams.get('include')).toBe('field_sectors,field_technologies')
    expect(requestUrl.searchParams.get('sort')).toBe('title')
    expect(requestUrl.searchParams.get('filter[country][path]')).toBe('field_country_code')
    expect(requestUrl.searchParams.get('filter[country][operator]')).toBe('=')
    expect(requestUrl.searchParams.get('filter[country][value]')).toBe('LU')
  })

  it('sends GET requests without a body', async () => {
    requestMock.mockResolvedValueOnce({ data: [] })

    await client.get('/node/cluster')

    const [, requestOptions] = requestMock.mock.calls[0]
    expect(requestOptions.fetchOptions?.method).toBe('GET')
    expect(requestOptions.fetchOptions?.body).toBeUndefined()
  })

  it.each([
    ['post', 'POST'],
    ['put', 'PUT'],
    ['patch', 'PATCH'],
  ] as const)('sends a JSON:API body through %s', async (clientMethod, httpMethod) => {
    requestMock.mockResolvedValueOnce({ data: { id: 'cluster-1' } })
    const body = { data: { id: 'cluster-1', attributes: { title: 'Updated cluster' } } }

    const result = await client[clientMethod]('/node/cluster/cluster-1', { body })

    expect(result).toEqual({ data: { id: 'cluster-1' } })
    const [, requestOptions] = requestMock.mock.calls[0]
    expect(requestOptions.fetchOptions?.method).toBe(httpMethod)
    expect(requestOptions.fetchOptions?.body).toBe(JSON.stringify(body))
  })

  it('forwards the configured timeout and requested retry count', async () => {
    requestMock.mockResolvedValueOnce({ data: [] })

    await client.get('/node/cluster', undefined, 2)

    const [, requestOptions] = requestMock.mock.calls[0]
    expect(requestOptions.timeout).toBe(30000)
    expect(requestOptions.maxRetries).toBe(2)
  })

  it('maps shared request failures to AtlasApiError', async () => {
    const errors = [{ status: '400', title: 'Invalid filter', detail: 'The country filter is invalid' }]
    requestMock.mockRejectedValueOnce(new ExternalApiError('API Error', 400, errors))

    await expect(client.get('/node/cluster')).rejects.toMatchObject({
      name: 'AtlasApiError',
      status: 400,
      errors,
    })
  })
})
