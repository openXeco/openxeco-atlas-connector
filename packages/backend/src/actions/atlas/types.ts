import type { TaxonomyType } from '@/types.js'
import type { getAtlasClient } from '@/actions/atlas/atlas-client.js'
import type { atlasFieldsComparable } from '@/actions/atlas/constants.js'

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
export type AtlasActionDependencies = {
  atlasClient: AtlasClient
}

export type AtlasJsonApiAddress =
  | { country_code?: string; locality?: string; address_line1?: string; postal_code?: string }
  | null
  | undefined

export type AtlasJsonApiWebsite = { uri?: string } | string | null | undefined

export type AtlasClusterInput = {
  // Basic information
  name: string
  nameNational?: string
  entityDepartment?: string

  // Address (structured)
  countryCode?: string
  city?: string
  streetAddress?: string

  // Organisation details
  email?: string
  phone?: string
  website?: string
  registrationNumber?: string

  // Headquarters
  isHeadquarter?: boolean
  headquarterInfo?: string

  // Subsidiaries
  hasSubsidiaries?: boolean
  subsidiariesDetails?: string
  hasMajorityShares?: boolean
  majoritySharesDetails?: string

  // Compliance
  article138Compliance?: boolean
  dataShareConsent?: boolean

  // Contact person
  contactFirstName?: string
  contactLastName?: string
  contactEmail?: string
  contactPosition?: string
  contactPhone?: string

  // Expertise
  expertiseDescription?: string
  goalsToAchieve?: string
  goalsToContribute?: string

  // Taxonomy references
  clusterTypeId?: string

  // JRC Taxonomy IDs
  thematicAreaIds?: string[]
  sectorIds?: string[]
  technologyIds?: string[]
  useCaseIds?: string[]
  fieldsOfActivityIds?: string[]

  // Workflow
  moderationState?: string
}

export type AtlasCluster = AtlasClusterInput & {
  atlasId: string

  // Taxonomy references
  countryId?: string
  organizationTypeId?: string

  // Timestamps
  updatedAt?: string // ATLAS 'changed' attribute (ISO date string)

  metadata?: Record<string, unknown>
}

export type PushEntityInput = {
  entityId: string
  userId?: string
}

export type PushEntityResult =
  | {
      code: 'synced'
      operation: 'created' | 'updated'
      entityId: string
      atlasId: string
    }
  | {
      code: 'selection_required'
      entityId: string
      candidates: AtlasCluster[]
    }

export type UpdateAtlasEntityResult =
  | {
      code: 'updated'
      cluster: AtlasCluster
    }
  | {
      code: 'conflict'
      atlasId: string
      conflictFields: string[]
      remote: AtlasCluster
    }
  | {
      code: 'not_found'
      atlasId: string
    }

export type SelectCorrespondenceResult = {
  code: 'selected'
  entityId: string
  atlasId: string
}

export type ForceCreateEntityResult = {
  code: 'synced'
  operation: 'created'
  entityId: string
  atlasId: string
}

export type ForceSyncEntityResult = {
  code: 'synced'
  entityId: string
  atlasId: string
}

export type ForcePushEntityResult = ForceSyncEntityResult
export type ForcePullEntityResult = ForceSyncEntityResult

export type AtlasFieldComparable = (typeof atlasFieldsComparable)[number]
