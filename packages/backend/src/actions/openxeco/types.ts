import type { ExternalApiError } from '@/actions/shared/types.js'

export type OxeCredentials = {
  email: string
  password: string
}

export type OxeSession = {
  accessToken: string
  refreshToken?: string
}

export type OxeClientConfig = {
  baseUrl: string
  timeout?: number
  httpsProxy?: string
}

export type OxeQueryParams = Record<string, boolean | number | string | null | undefined>

export type OxeRequestParams = {
  body?: unknown
  params?: OxeQueryParams
}

export interface OxeApiError extends ExternalApiError {}
