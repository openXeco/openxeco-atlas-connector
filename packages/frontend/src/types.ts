// Auth
import type { ENTITY_STATUSES, SYNC_CODES, SYNC_STATUSES } from '@/lib/constants'

export interface ApiClientOptions extends RequestInit {
  params?: Record<string, string>
  accessToken?: string
}

export interface ApiClientError extends Error {
  statusCode: number
  payload?: Record<string, unknown>
}

export interface User {
  id: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

// ATLAS
export type TaxonomyType =
  | 'applications_and_technologies'
  | 'cluster_thematic_area'
  | 'cluster_type'
  | 'country'
  | 'fields_of_activity'
  | 'languages'
  | 'nationality'
  | 'sectors'
  | 'technologies'
  | 'use_cases'

export interface TaxonomyTypeInfo {
  type: TaxonomyType
  label: string
  description: string
  count?: number
  lastSynced?: Date
}

export interface Taxonomy {
  id: string
  atlasId: string | null
  taxonomyType: TaxonomyType
  name: string
  description: string | null
  parentId: string | null
  metadata: Record<string, unknown> | null
  lastSyncedAt: string
}

export type EntityStatus = (typeof ENTITY_STATUSES)[number]
export type SyncStatus = (typeof SYNC_STATUSES)[number]
export type SyncCode = (typeof SYNC_CODES)[number]

export type SyncRecap = {
  total: number
  moderation: Record<EntityStatus, number>
  sync: Record<SyncStatus, number>
}

export interface Entity {
  id: string
  atlasId: string | null
  name: string
  nameNational: string | null
  entityDepartment: string | null
  status: EntityStatus
  syncStatus: SyncStatus
  syncCode: SyncCode | null
  countryCode: string | null
  city: string | null
  streetAddress: string | null
  email: string | null
  phone: string | null
  registrationNumber: string | null
  countryId: string | null
  clusterTypeId: string | null
  organizationTypeId: string | null
  website: string | null
  isHeadquarter: boolean | null
  headquarterInfo: string | null
  hasSubsidiaries: boolean | null
  subsidiariesDetails: string | null
  hasMajorityShares: boolean | null
  majoritySharesDetails: string | null
  article138Compliance: boolean | null
  dataShareConsent: boolean | null
  contactFirstName: string | null
  contactLastName: string | null
  contactEmail: string | null
  contactPosition: string | null
  contactPhone: string | null
  expertiseDescription: string | null
  goalsToAchieve: string | null
  goalsToContribute: string | null

  // Consent fields
  dataProtectionConsent: boolean | null
  formCompletionConfirmed: boolean | null
  metadata: unknown
  createdAt: Date
  updatedAt: Date
  lastSyncedAt: Date | null
  // Relations
  country?: Taxonomy
  clusterType?: Taxonomy
  thematicAreas?: Array<Taxonomy>
  sectors?: Array<Taxonomy>
  technologies?: Array<Taxonomy>
  useCases?: Array<Taxonomy>
  fieldsOfActivity?: Array<Taxonomy>
}

export type EntityFormData = {
  name: string
  nameNational?: string
  entityDepartment?: string
  description?: string
  countryCode?: string
  city?: string
  streetAddress?: string
  email?: string
  phone?: string
  registrationNumber?: string
  website?: string
  isHeadquarter?: boolean
  headquarterInfo?: string
  hasSubsidiaries?: boolean
  subsidiariesDetails?: string
  hasMajorityShares?: boolean
  majoritySharesDetails?: string
  article138Compliance?: boolean
  dataShareConsent?: boolean
  contactFirstName?: string
  contactLastName?: string
  contactEmail?: string
  contactPosition?: string
  contactPhone?: string
  expertiseDescription?: string
  goalsToAchieve?: string
  goalsToContribute?: string
  // Consent fields (ECCC form Step 4)
  dataProtectionConsent?: boolean
  formCompletionConfirmed?: boolean
  countryId?: string
  clusterTypeId?: string
  thematicAreaIds?: string[]
  sectorIds?: string[]
  technologyIds?: string[]
  useCaseIds?: string[]
  fieldsOfActivityIds?: string[]
  status?: EntityStatus
}

export interface EntityListParams {
  page?: number
  limit?: number
  status?: EntityStatus
  syncStatus?: SyncStatus
  syncCode?: SyncCode
  search?: string
  countryId?: string
  clusterTypeId?: string
}

export type EntitySync = Pick<Entity, 'id' | 'atlasId' | 'name' | 'lastSyncedAt' | 'updatedAt' | 'syncStatus'> & {
  atlasUpdatedAt?: Date | null
}

export type EntityTaxonomies = {
  countries: Taxonomy[]
  clusterTypes: Taxonomy[]
  fieldsOfActivity: Taxonomy[]
  thematicAreas: Taxonomy[]
  sectors: Taxonomy[]
  technologies: Taxonomy[]
  useCases: Taxonomy[]
}

// Various
export interface HealthResponse {
  status: 'ok' | 'error'
  timestamp: string
  services: {
    database: 'ok' | 'error'
  }
}

// UI related types
export type ActionState = { success: true; message: string } | { success: false; error: string }
export type ActionStateWithErrors =
  | { success: true; message: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

// App
export type GeneralSettings = {
  country?: string
}
