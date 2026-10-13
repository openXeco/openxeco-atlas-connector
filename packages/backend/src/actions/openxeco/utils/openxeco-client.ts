import { ProxyAgent, type RequestInit, type Response } from 'undici'
import type { Logger } from '@/types.js'
import type {
  OxeSession,
  OxeClientConfig,
  OxeCredentials,
  OxeQueryParams,
  OxeRequestParams,
} from '@/actions/openxeco/types.js'
import { OxeApiError, OxeAuthenticationError } from '@/actions/openxeco/utils/openxeco-api-error.js'
import { request } from '@/actions/shared/api-request.js'
import { ExternalApiError } from '@/actions/shared/api-error.js'
import { z } from 'zod'

export class OxeClient {
  private readonly config: OxeClientConfig
  private readonly credentials: OxeCredentials
  private readonly proxyDispatcher?: ProxyAgent
  private readonly logger: Logger
  private session?: OxeSession
  private authentication?: Promise<OxeSession>
  private readonly loginBodySchema = z
    .object({
      access_token: z.string().optional(),
      refresh_token: z.string().optional(),
    })
    .passthrough()

  constructor(config: OxeClientConfig, credentials: OxeCredentials, logger: Logger) {
    const baseUrl = new URL(config.baseUrl)
    baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, '')}/`
    baseUrl.search = ''
    baseUrl.hash = ''

    this.config = { timeout: 30000, ...config, baseUrl: baseUrl.toString() }
    this.credentials = credentials
    this.logger = logger

    if (config.httpsProxy) {
      this.proxyDispatcher = new ProxyAgent(config.httpsProxy)
    }
  }

  public async get<R = unknown>(path: string, params?: OxeQueryParams, maxRetries = 1): Promise<R> {
    return await this._request<R>('GET', path, { params }, maxRetries)
  }

  public async post<R = unknown>(path: string, options?: OxeRequestParams): Promise<R> {
    return await this._request<R>('POST', path, options)
  }

  private async _request<R = unknown>(
    method: string,
    path: string,
    options?: OxeRequestParams,
    maxRetries = 1,
  ): Promise<R> {
    const session = await this._prepareAuthentication()
    const url = this._buildUrl(path, options?.params)
    const cookies = [`access_token_cookie=${session.accessToken}`]

    if (session.refreshToken) {
      cookies.push(`refresh_token_cookie=${session.refreshToken}`)
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
        Cookie: cookies.join('; '),
        ...(options?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    }

    this._applyProxy(fetchOptions)

    try {
      return await request<R>(url, {
        fetchOptions,
        logger: this.logger,
        maxRetries,
        timeout: this.config.timeout,
      })
    } catch (error) {
      if (error instanceof ExternalApiError) {
        throw new OxeApiError(error.message, error.status, error.errors)
      }

      throw error
    }
  }

  private async _prepareAuthentication(): Promise<OxeSession> {
    if (this.session) {
      return this.session
    }

    this.authentication ??= this._login()

    try {
      this.session = await this.authentication
      return this.session
    } finally {
      this.authentication = undefined
    }
  }

  private async _login(): Promise<OxeSession> {
    const url = this._buildUrl('/account/login')
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'OpenXeco-ATLAS-Connector/1.0',
      },
      body: JSON.stringify(this.credentials),
    }

    this._applyProxy(fetchOptions)

    try {
      return await request<OxeSession>(url, {
        fetchOptions,
        logger: this.logger,
        timeout: this.config.timeout,
        parseResponse: (response) => this._parseOxeSession(response),
      })
    } catch (error) {
      if (error instanceof ExternalApiError && error.status === 401) {
        throw new OxeAuthenticationError()
      }

      if (error instanceof ExternalApiError) {
        throw new OxeApiError(error.message, error.status, error.errors)
      }

      throw error
    }
  }

  private async _parseOxeSession(response: Response): Promise<OxeSession> {
    let accessToken: string | undefined
    let refreshToken: string | undefined

    for (const setCookie of response.headers.getSetCookie()) {
      accessToken ??= this._extractCookie(setCookie, 'access_token_cookie')
      refreshToken ??= this._extractCookie(setCookie, 'refresh_token_cookie')
    }

    if (!accessToken) {
      const body = this.loginBodySchema.safeParse(await response.json().catch(() => null))

      if (body.success) {
        accessToken = body.data.access_token
        refreshToken = body.data.refresh_token
      }
    }

    if (!accessToken) {
      throw new OxeApiError('Login succeeded but no authentication token was returned.', 502)
    }

    return { accessToken, refreshToken }
  }

  private _extractCookie(setCookieHeader: string, expectedName: string): string | undefined {
    const [nameValuePair] = setCookieHeader.split(';', 1)

    if (!nameValuePair) {
      return undefined
    }

    const separatorIndex = nameValuePair.indexOf('=')

    if (separatorIndex === -1) {
      return undefined
    }

    const name = nameValuePair.slice(0, separatorIndex).trim()

    if (name !== expectedName) {
      return undefined
    }

    return nameValuePair.slice(separatorIndex + 1).trim() || undefined
  }

  private _buildUrl(path: string, params?: OxeQueryParams): URL {
    const url = new URL(path.replace(/^\/+/, ''), this.config.baseUrl)

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value))
        }
      }
    }

    return url
  }

  private _applyProxy(fetchOptions: RequestInit): void {
    if (this.proxyDispatcher) {
      fetchOptions.dispatcher = this.proxyDispatcher
    }
  }
}
