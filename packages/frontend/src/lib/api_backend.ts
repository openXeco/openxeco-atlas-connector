interface ApiOptions extends RequestInit {
  params?: Record<string, string>
  accessToken?: string
}

type ApiError = {
  statusCode: number
  error: string
  message: string
}

class ApiClientBackend {
  private accessToken?: string

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

    let url = `${this.baseUrl}${endpoint}`

    if (params) {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    }

    const response = await fetch(url, {
      ...fetchOptions,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.accessToken && { Authorization: `Bearer ${options.accessToken}` }),
        ...fetchOptions.headers,
      },
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      const message = Array.isArray(error.message) ? String(error.message) : error.message || 'An error has occurred'
      throw new Error(message || 'An error occurred')
    }

    return response.json()
  }
}

export const apiClientBackend = new ApiClientBackend(process.env.PUBLIC_API_URL || '')
