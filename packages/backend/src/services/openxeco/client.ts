/**
 * OpenXeco (cybersecurity.lu) API Client
 *
 * Handles authentication and data fetching from the cybersecurity.lu platform
 */

type QuestionParams = {
  formId?: number
  session: OpenXecoSession
}

import type { OpenXecoFormQuestion, OpenXecoFormAnswer } from './types.js'
import { type Logger, getLogger } from '@/utils/logger.js'

const OPENXECO_API_BASE = 'https://api.cybersecurity.lu'
const ECCC_FORM_ID = 11

export interface OpenXecoCredentials {
  email: string
  password: string
}

export interface OpenXecoSession {
  accessToken: string
  refreshToken?: string
}

export class OpenXecoClient {
  private readonly baseUrl: string
  private readonly timeout: number
  private readonly logger: Logger

  constructor(baseUrl: string = OPENXECO_API_BASE, timeout = 30000) {
    this.baseUrl = baseUrl
    this.timeout = timeout
    this.logger = getLogger()
  }

  /**
   * Login to cybersecurity.lu and get session tokens
   */
  async login(credentials: OpenXecoCredentials): Promise<OpenXecoSession> {
    const url = `${this.baseUrl}/account/login`

    this.logger.info({ email: credentials.email }, 'OpenXeco: Attempting login')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; ATLAS-Connector/1.0)',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const status = response.status
        let errorBody = ''
        try {
          errorBody = await response.text()
        } catch {
          /* ignore */
        }

        this.logger.error(
          {
            status,
            statusText: response.statusText,
            errorBody: errorBody.substring(0, 500),
          },
          'OpenXeco: Login failed',
        )

        if (status === 401) {
          throw new Error('Invalid credentials: email or password is incorrect')
        }
        // Per API docs, login only returns 200 or 401 — any other status is a server-side issue
        const hint = errorBody.substring(0, 200)
        throw new Error(`cybersecurity.lu API error (${status}): ${hint || response.statusText}`)
      }

      // Extract cookies from response - use getSetCookie() for Node.js 18+
      let accessToken = ''
      let refreshToken = ''

      // Try getSetCookie() first (Node.js 18+), fallback to get('set-cookie')
      const setCookieHeaders =
        (response.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ??
        ([response.headers.get('set-cookie')].filter(Boolean) as string[])

      this.logger.debug(
        {
          setCookieCount: setCookieHeaders.length,
          setCookieHeaders: setCookieHeaders.map((c) => `${c?.substring(0, 50)}...`),
        },
        'OpenXeco: Login response headers',
      )

      for (const cookie of setCookieHeaders) {
        if (!cookie) continue
        const accessMatch = cookie.match(/access_token_cookie=([^;]+)/)
        const refreshMatch = cookie.match(/refresh_token_cookie=([^;]+)/)

        if (accessMatch) accessToken = accessMatch[1]
        if (refreshMatch) refreshToken = refreshMatch[1]
      }

      // If no cookies, try to get token from response body
      if (!accessToken) {
        try {
          const body = (await response.json()) as Record<string, unknown>
          this.logger.debug({ bodyKeys: Object.keys(body) }, 'OpenXeco: Login response body')

          if (typeof body.access_token === 'string') accessToken = body.access_token
          if (typeof body.refresh_token === 'string') refreshToken = body.refresh_token
        } catch {
          // Response might not be JSON
          this.logger.debug('OpenXeco: Login response is not JSON')
        }
      }

      if (!accessToken) {
        this.logger.warn('OpenXeco: No token found in login response')
        throw new Error('Login succeeded but no authentication token was returned')
      }

      this.logger.info({ hasRefreshToken: !!refreshToken }, 'OpenXeco: Login successful')

      return {
        accessToken,
        refreshToken: refreshToken || undefined,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Login request timed out')
      }
      throw error
    }
  }

  /**
   * Get form questions structure
   */
  async getFormQuestions({ formId = ECCC_FORM_ID, session }: QuestionParams): Promise<OpenXecoFormQuestion[]> {
    const url = `${this.baseUrl}/private/get_my_form_questions?form_id=${formId}`

    this.logger.info({ formId }, 'OpenXeco: Fetching form questions')

    const response = await this.authenticatedRequest(url, session)

    if (!response.ok) {
      const status = response.status
      if (status === 422) {
        throw new Error('Form not found or not accessible')
      }
      throw new Error(`Failed to fetch form questions: ${status}`)
    }

    const data = await response.json()
    return data as OpenXecoFormQuestion[]
  }

  /**
   * Get user's form answers
   */
  async getFormAnswers({ formId = ECCC_FORM_ID, session }: QuestionParams): Promise<OpenXecoFormAnswer[]> {
    // Use the private endpoint for user-specific answers
    const url = `${this.baseUrl}/private/get_my_form_answers?form_id=${formId}`

    this.logger.info({ formId }, 'OpenXeco: Fetching form answers')

    const response = await this.authenticatedRequest(url, session)

    if (!response.ok) {
      const status = response.status
      if (status === 401) {
        throw new Error('Session expired or invalid')
      }
      throw new Error(`Failed to fetch form answers: ${status}`)
    }

    const data = await response.json()
    return data as OpenXecoFormAnswer[]
  }

  /**
   * Make an authenticated request
   */
  private async authenticatedRequest(url: string, session: OpenXecoSession): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      }

      // Send both Authorization header and Cookie for maximum compatibility
      if (session.accessToken) {
        headers.Authorization = `Bearer ${session.accessToken}`
        // Also send as cookie
        const cookies = [`access_token_cookie=${session.accessToken}`]
        if (session.refreshToken) {
          cookies.push(`refresh_token_cookie=${session.refreshToken}`)
        }
        headers.Cookie = cookies.join('; ')
      }

      this.logger.debug({ url }, 'OpenXeco: Making authenticated request')

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out')
      }
      throw error
    }
  }
}

// Default client instance
export const openXecoClient = new OpenXecoClient()
