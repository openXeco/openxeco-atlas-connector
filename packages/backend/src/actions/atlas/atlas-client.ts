import type {
  AtlasConfig,
  AtlasJsonApiResource,
  AtlasJsonApiDocument,
  AtlasRequestParams,
  AtlasQueryParams,
} from '@/actions/atlas/types.js'
import { ProxyAgent, type RequestInit, fetch } from 'undici'
import type { Logger, Env } from '@/types.js'

import { AtlasApiError } from '@/actions/atlas/utils/atlas-api-error.js'

class AtlasClient {
  private readonly config: AtlasConfig
  private authToken?: string
  private tokenExpiry?: Date
  private readonly proxyDispatcher?: ProxyAgent
  private readonly logger: Logger
  private readonly RETRYABLE_STATUSES = [408, 429, 502, 503, 504]

  constructor(config: AtlasConfig, logger: Logger) {
    this.config = config

    this.logger = logger

    if (config.httpsProxy) {
      this.proxyDispatcher = new ProxyAgent(config.httpsProxy)
    }
  }

  public async get<T = AtlasJsonApiResource>(path: string, params?: AtlasRequestParams['params'], maxRetries = 1) {
    return this._request<T>(
      'GET',
      path,
      {
        params,
      },
      maxRetries,
    )
  }

  public async post<T = AtlasJsonApiResource>(path: string, options?: AtlasRequestParams) {
    return this._request<T>('POST', path, options)
  }

  public async patch<T = AtlasJsonApiResource>(path: string, options?: AtlasRequestParams) {
    return this._request<T>('PATCH', path, options)
  }

  public async put<T = AtlasJsonApiResource>(path: string, options?: AtlasRequestParams) {
    return this._request<T>('PUT', path, options)
  }

  private async _request<T = AtlasJsonApiResource>(
    method: string,
    path: string,
    options?: AtlasRequestParams,
    maxRetries = 1,
  ): Promise<AtlasJsonApiDocument<T>> {
    this._prepareAuthentication()

    const url = this._getUrlAndQuery(path, options?.params)

    const headers: Record<string, string> = {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
      'api-key': this.config.apiKey,
    }

    if (this.authToken) {
      const authScheme = this.config.username && this.config.password ? 'Basic' : 'Bearer'
      headers.Authorization = `${authScheme} ${this.authToken}`
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    }

    if (this.proxyDispatcher) {
      // undici ProxyAgent as dispatcher for proxy support
      ;(fetchOptions as Record<string, unknown>).dispatcher = this.proxyDispatcher
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.logger.info(`ATLAS API request: ${method} ${url.toString()} (attempt ${attempt}/${maxRetries})`)

      try {
        return await this._executeRequest(url, {
          ...fetchOptions,
          signal: AbortSignal.timeout(this.config.timeout ?? 30000),
        })
      } catch (e) {
        const canRetry = attempt < maxRetries && this._isRetrySafeMethod(method)

        if (e instanceof AtlasApiError) {
          const retryable = canRetry && this.RETRYABLE_STATUSES.includes(e.status)

          if (retryable) {
            await this._retry(e, attempt, maxRetries)
            continue
          }

          this.logger.error(
            {
              err: e,
              status: e.status,
              errors: e.errors,
              method,
              url: url.toString(),
            },
            'ATLAS API request failed',
          )

          throw e
        }

        // We never retry explicit cancelation
        if (e instanceof DOMException && e.name === 'AbortError') {
          this.logger.info({ method, url: url.toString() }, 'ATLAS API request aborted')

          throw e
        }

        if (e instanceof DOMException && e.name === 'TimeoutError') {
          if (canRetry) {
            await this._retry(e, attempt, maxRetries)
            continue
          }

          throw new Error('ATLAS API request timed out', {
            cause: e,
          })
        }

        if (e instanceof SyntaxError) {
          throw new Error('ATLAS API returned an invalid JSON response', {
            cause: e,
          })
        }

        if (e instanceof TypeError) {
          if (canRetry && this._isTransientNetworkError(e)) {
            await this._retry(e, attempt, maxRetries)
            continue
          }

          throw new Error('ATLAS API transport error', {
            cause: e,
          })
        }

        if (e instanceof Error) {
          this.logger.error(
            {
              err: e,
              method,
              url: url.toString(),
            },
            'Unexpected ATLAS API error',
          )

          throw e
        }

        throw new Error('Unknown ATLAS API failure', {
          cause: e,
        })
      }
    }

    throw new Error('ATLAS API unexpected error after retries.')
  }

  private async _executeRequest<T = AtlasJsonApiResource>(url: URL, fetchOptions: RequestInit) {
    const response = await fetch(url.toString(), fetchOptions)

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as AtlasJsonApiDocument
      throw new AtlasApiError('ATLAS API error', response.status, data.errors || [])
    }

    const payload = (await response.json()) as AtlasJsonApiDocument<T>

    if (payload.errors && payload.errors.length > 0) {
      throw new AtlasApiError('ATLAS API error', response.status, payload.errors)
    }

    return payload
  }

  // NOTE: we don't add POST, PUT, PATCH because we're not sure how ATLAS threats duplicate requests
  private _isRetrySafeMethod(method: string): boolean {
    return ['GET', 'HEAD', 'OPTIONS'].includes(method)
  }

  private _isTransientNetworkError(error: TypeError): boolean {
    const cause = error.cause

    if (!(cause instanceof Error) || !('code' in cause)) {
      return false
    }

    const code = String(cause.code)

    return [
      'ECONNRESET',
      'ECONNREFUSED',
      'EPIPE',
      'ETIMEDOUT',
      'ENETUNREACH',
      'EAI_AGAIN',
      'UND_ERR_CONNECT_TIMEOUT',
      'UND_ERR_HEADERS_TIMEOUT',
      'UND_ERR_BODY_TIMEOUT',
      'UND_ERR_SOCKET',
    ].includes(code)
  }

  private async _retry(error: Error, attempt: number, maxAttempts: number): Promise<void> {
    const delay = Math.min(1000 * 2 ** (attempt - 1), 10_000)

    this.logger.warn(
      {
        err: error,
        attempt,
        maxAttempts,
        delay,
      },
      'Retrying ATLAS API request',
    )

    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  private _prepareAuthentication(): void {
    if (this.authToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return
    }

    if (this.config.username && this.config.password) {
      const credentials = `${this.config.username}:${this.config.password}`
      this.authToken = Buffer.from(credentials).toString('base64')
      this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
      this.logger.info('ATLAS authenticated with Basic Auth')
    }
  }

  private _getUrlAndQuery(path: string, params?: AtlasQueryParams): URL {
    const relativePath = path.replace(/^\/+/, '')
    const url = new URL(relativePath, this.config.baseUrl)

    if (params) {
      if (params.pageOffset !== undefined) {
        url.searchParams.set('page[offset]', String(params.pageOffset))
      }
      if (params.pageLimit !== undefined) {
        url.searchParams.set('page[limit]', String(params.pageLimit))
      }
      if (params.page) {
        url.searchParams.set('page[number]', String(params.page))
      }
      if (params.pageSize) {
        url.searchParams.set('page[size]', String(params.pageSize))
      }
      if (params.filter) {
        Object.entries(params.filter).forEach(([key, value]) => {
          this._appendQueryParams(url.searchParams, value, `filter[${key}]`)
        })
      }
      if (params.include) {
        url.searchParams.set('include', params.include.join(','))
      }
      if (params.sort) {
        url.searchParams.set('sort', params.sort)
      }
    }

    return url
  }

  private _appendQueryParams(searchParams: URLSearchParams, value: unknown, prefix: string) {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        this._appendQueryParams(searchParams, item, `${prefix}[]`)
      })
    } else if (value !== null && typeof value === 'object') {
      Object.entries(value).forEach(([key, val]) => {
        this._appendQueryParams(searchParams, val, `${prefix}[${key}]`)
      })
    } else if (value !== undefined) {
      searchParams.append(prefix, String(value))
    }
  }
}

let client: AtlasClient | undefined

export const getAtlasClient = ({
  appConfig,
  logger,
  overrideAtlasConfig,
}: {
  appConfig: Env
  logger: Logger
  overrideAtlasConfig?: AtlasConfig
}) => {
  if (!client) {
    const config = {
      baseUrl: new URL(appConfig.ATLAS_BASE_URL),
      apiKey: appConfig.ATLAS_API_KEY,
      username: appConfig.ATLAS_USERNAME,
      password: appConfig.ATLAS_PASSWORD,
      timeout: 30000,
      httpsProxy: appConfig.HTTPS_PROXY,
      ...overrideAtlasConfig,
    }

    config.baseUrl.pathname = `${config.baseUrl.pathname.replace(/\/+$/, '')}/`
    config.baseUrl.search = ''
    config.baseUrl.hash = ''

    client = new AtlasClient(config, logger)
  }

  return client
}
