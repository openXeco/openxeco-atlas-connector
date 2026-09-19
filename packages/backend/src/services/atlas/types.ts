export interface JsonApiResourceIdentifier {
  type: string
  id: string
}

export interface JsonApiRelationship {
  data?: JsonApiResourceIdentifier | JsonApiResourceIdentifier[] | null
  links?: Record<string, string>
}

export interface JsonApiResource {
  type: string
  id: string
  attributes: Record<string, unknown>
  relationships?: Record<string, JsonApiRelationship>
  links?: Record<string, string>
}

export interface JsonApiError {
  id?: string
  status?: string
  code?: string
  title?: string
  detail?: string
  source?: {
    pointer?: string
    parameter?: string
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
  }
  links?: {
    first?: string
    last?: string
    prev?: string
    next?: string
  }
}

export interface ClusterAttributes {
  name: string
  description?: string
  logo_url?: string
  website?: string
  address?: string
  latitude?: number
  longitude?: number
  status?: string
  [key: string]: unknown
}

export interface AtlasConfig {
  baseUrl: string
  apiKey: string
  username?: string
  password?: string
  timeout?: number
}

export interface QueryParams {
  page?: number
  pageSize?: number
  pageOffset?: number
  pageLimit?: number
  filter?: Record<string, unknown>
  include?: string[]
  sort?: string
}

export interface JsonApiDocument<T = JsonApiResource> {
  data?: T | T[] | null
  included?: JsonApiResource[]
  meta?: Record<string, unknown>
  links?: Record<string, string>
  errors?: JsonApiError[]
}
