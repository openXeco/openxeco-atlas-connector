import type { TaxonomyType } from '@/types.js'
import type { getAtlasClient } from '@/actions/atlas/atlas-client.js'

export interface AtlasConfig {
  baseUrl: URL
  apiKey: string
  username?: string
  password?: string
  timeout?: number
  httpsProxy?: string
}

export type AtlasPaginationParams = Partial<{
  page: number
  pageSize: number
  pageOffset: number
  pageLimit: number
  pageDelayMs: number
}>

export type AtlasQueryParams = Partial<{
  filter: Record<string, unknown>
  include: string[]
  sort: string
}> &
  AtlasPaginationParams

export type AtlasRequestParams<T = unknown> = {
  body?: T
  params?: AtlasQueryParams
}

export type AtlasJsonApiResourceIdentifier = {
  type: string
  id: string
}

export type AtlasJsonApiRelationship = {
  data?: AtlasJsonApiResourceIdentifier | AtlasJsonApiResourceIdentifier[] | null
  links?: Record<string, string>
}

export type AtlasJsonApiResource = {
  type: string
  id: string
  attributes: Record<string, unknown>
  relationships?: Record<string, AtlasJsonApiRelationship>
  links?: Record<string, string>
}

export type AtlasJsonApiDocument<T = AtlasJsonApiResource> = {
  data?: T | null
  included?: AtlasJsonApiResource[]
  meta?: Record<string, unknown>
  links?: Record<string, string>
  errors?: AtlasJsonApiError[]
}

export type AtlasJsonApiError = {
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

export interface AtlasApiError extends Error {
  readonly status: number
  readonly errors?: AtlasJsonApiError[]
}
export type AtlasTaxonomyTerm = {
  id: string
  atlasId: string
  type: TaxonomyType
  name: string
  description?: string
  parentId?: string
  metadata?: Record<string, unknown>
}

export type AtlasClient = ReturnType<typeof getAtlasClient>
