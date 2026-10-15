import type { ExternalApiError } from '@/actions/shared/types.js'
import type { getOxeSessionManager } from '@/actions/openxeco/utils/openxeco-session.js'

export type OxeCredentials = {
  email: string
  password: string
}

export type OxeSession = {
  accessToken: string
  refreshToken?: string
}

export type OxeClientConfig = {
  baseUrl: URL
  timeout?: number
  httpsProxy?: string
}

export type OxeQueryParams = Record<string, boolean | number | string | null | undefined>

export type OxeRequestParams = {
  body?: unknown
  params?: OxeQueryParams
}

export interface OxeApiError extends ExternalApiError {}

export type OxeSessionManager = ReturnType<typeof getOxeSessionManager>
export type OxeActionDependencies = {
  oxeSessionManager: OxeSessionManager
}
