import type { Env } from '@/types.js'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetch } from 'undici'
import type { AtlasClient } from '@/actions/atlas/types.js'
import { makeLogger } from '@/actions/atlas/test-support/fakes.js'

vi.mock('undici', async (importOriginal) => {
  const actual = await importOriginal<typeof import('undici')>()

  return {
    ...actual,
    fetch: vi.fn(),
  }
})

type Client = AtlasClient
type FetchResponse = Awaited<ReturnType<typeof fetch>>

const fetchMock = vi.mocked(fetch)
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
  ATLAS_API_KEY: 'atlas-api-key',
  ATLAS_USERNAME: 'atlas-user',
  ATLAS_PASSWORD: 'atlas-password',
}

const jsonResponse = (status: number, body: unknown): FetchResponse =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as FetchResponse

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
    fetchMock.mockReset()
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  it('posts an authenticated JSON:API document with query parameters', async () => {
    const document = {
      data: {
        type: 'node--cluster',
        id: 'cluster-1',
        attributes: { title: 'Cluster One' },
      },
    }
    fetchMock.mockResolvedValueOnce(jsonResponse(200, document))

    const result = await client.post('/node/cluster', {
      body: { data: { type: 'node--cluster' } },
      params: {
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
      },
    })

    expect(result).toEqual(document)
    expect(fetchMock).toHaveBeenCalledOnce()

    const [requestUrl, requestInit] = fetchMock.mock.calls[0]
    const url = new URL(String(requestUrl))
    const headers = requestInit?.headers as Record<string, string>

    expect(url.origin).toBe('https://atlas.example')
    expect(url.pathname).toBe('/api/node/cluster')
    expect(url.searchParams.get('page[offset]')).toBe('0')
    expect(url.searchParams.get('page[limit]')).toBe('50')
    expect(url.searchParams.get('include')).toBe('field_sectors,field_technologies')
    expect(url.searchParams.get('sort')).toBe('title')
    expect(url.searchParams.get('filter[country][value]')).toBe('LU')
    expect(requestInit?.method).toBe('POST')
    expect(requestInit?.body).toBe('{"data":{"type":"node--cluster"}}')
    expect(headers['api-key']).toBe('atlas-api-key')
    expect(headers.Authorization).toBe(`Basic ${Buffer.from('atlas-user:atlas-password').toString('base64')}`)
    expect(requestInit?.signal).toBeInstanceOf(AbortSignal)
  })

  it('gets a JSON:API document with query parameters and no body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: [] }))

    await expect(
      client.get('/node/cluster', {
        pageOffset: 0,
        pageLimit: 25,
      }),
    ).resolves.toEqual({ data: [] })

    const [requestUrl, requestInit] = fetchMock.mock.calls[0]
    const url = new URL(String(requestUrl))

    expect(requestInit?.method).toBe('GET')
    expect(requestInit?.body).toBeUndefined()
    expect(url.searchParams.get('page[offset]')).toBe('0')
    expect(url.searchParams.get('page[limit]')).toBe('25')
  })

  it.each([
    ['put', 'PUT'],
    ['patch', 'PATCH'],
  ] as const)('sends a JSON:API body through %s', async (clientMethod, httpMethod) => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: { id: 'cluster-1' } }))
    const body = { data: { id: 'cluster-1', attributes: { title: 'Updated cluster' } } }

    await client[clientMethod]('/node/cluster/cluster-1', { body })

    const [, requestInit] = fetchMock.mock.calls[0]
    expect(requestInit?.method).toBe(httpMethod)
    expect(requestInit?.body).toBe(JSON.stringify(body))
  })

  it('throws the structured Atlas error for a non-retryable response', async () => {
    const errors = [{ status: '400', title: 'Invalid filter', detail: 'The country filter is invalid' }]
    fetchMock.mockResolvedValueOnce(jsonResponse(400, { errors }))

    await expect(client.get('/node/cluster', undefined, 2)).rejects.toMatchObject({
      name: 'AtlasApiError',
      status: 400,
      errors,
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
