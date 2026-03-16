import { getAccessToken } from '@/app/actions/auth'

interface ApiOptions extends RequestInit {
  params?: Record<string, string>
  accessToken?: string
}

interface ApiError {
  statusCode: number
  error: string
  message: string
}

class ApiClientBackend {
  constructor(private readonly baseUrl: string) {}

  async get<T>(endpoint: string, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: unknown, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options

    let accessToken
    if (fetchOptions.credentials === 'include') {
      accessToken = await getAccessToken()

      if (!accessToken) {
        throw new Error('Access token not found.')
      }
    }

    let url = `${this.baseUrl}${endpoint}`

    if (params) {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...(fetchOptions.method !== 'DELETE' && {'Content-Type': 'application/json'}),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...fetchOptions.headers,
      },
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      console.error(error)
      const message = Array.isArray(error.message) ? String(error.message) : error.message || 'An error has occurred'
      throw new Error(message || 'An error occurred')
    }

    return response.json()
  }
}

const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://backend:3001'

export const apiClientBackend = new ApiClientBackend(backendUrl)
