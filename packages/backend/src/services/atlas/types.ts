export interface JsonApiResource {
  type: string
  id: string
  attributes: Record<string, unknown>
  relationships?: Record<string, JsonApiRelationship>
  links?: Record<string, string>
}

export interface JsonApiRelationship {
  data?: JsonApiResourceIdentifier | JsonApiResourceIdentifier[] | null
  links?: Record<string, string>
}

export interface JsonApiResourceIdentifier {
  type: string
  id: string
}

export interface JsonApiDocument<T = JsonApiResource> {
  data?: T | T[] | null
  included?: JsonApiResource[]
  meta?: Record<string, unknown>
  links?: Record<string, string>
  errors?: JsonApiError[]
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

export type TaxonomyType =
  | 'activities_of_interest'
  | 'applications_and_technologies'
  | 'cluster_thematic_area'
  | 'cluster_type'
  | 'country'
  | 'cybersecurity_research_projects'
  | 'european_cybersecurity_competenc'
  | 'fields_of_activity'
  | 'funding_sources'
  | 'initiatives'
  | 'institution'
  | 'languages'
  | 'legal_status'
  | 'nationality'
  | 'organization_type'
  | 'position_category'
  | 'sectors'
  | 'technologies'
  | 'use_cases'
  | 'citations_source'

export interface TaxonomyTerm {
  id: string
  atlasId: string
  type: TaxonomyType
  name: string
  description?: string
  parentId?: string
  metadata?: Record<string, unknown>
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

export interface Cluster {
  id: string
  atlasId: string

  // Basic information
  name: string
  nameNational?: string
  entityDepartment?: string
  description?: string

  // Address (structured)
  countryCode?: string
  city?: string
  streetAddress?: string
  postalCode?: string
  latitude?: number
  longitude?: number

  // Organization details
  email?: string
  phone?: string
  website?: string
  registrationNumber?: string
  logoUrl?: string

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
  countryId?: string
  clusterTypeId?: string
  organizationTypeId?: string

  // JRC Taxonomy IDs
  thematicAreaIds?: string[]
  sectorIds?: string[]
  technologyIds?: string[]
  useCaseIds?: string[]
  fieldsOfActivityIds?: string[]

  // Workflow
  status?: string
  moderationState?: string

  // Timestamps
  updatedAt?: string // ATLAS 'changed' attribute (ISO date string)

  metadata?: Record<string, unknown>
}

export interface ClusterInput {
  // Basic information
  name: string
  nameNational?: string
  entityDepartment?: string
  description?: string

  // Address (structured)
  countryCode?: string
  city?: string
  streetAddress?: string
  postalCode?: string
  latitude?: number
  longitude?: number

  // Organization details
  email?: string
  phone?: string
  website?: string
  registrationNumber?: string
  logoUrl?: string

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
  countryId?: string
  clusterTypeId?: string
  organizationTypeId?: string

  // JRC Taxonomy IDs
  thematicAreaIds?: string[]
  sectorIds?: string[]
  technologyIds?: string[]
  useCaseIds?: string[]
  fieldsOfActivityIds?: string[]

  // Workflow
  moderationState?: string
}

export interface AtlasConfig {
  baseUrl: string
  apiKey?: string
  username?: string
  password?: string
  timeout?: number
}

export interface QueryParams {
  page?: number
  pageSize?: number
  filter?: Record<string, string>
  include?: string[]
  sort?: string
}
