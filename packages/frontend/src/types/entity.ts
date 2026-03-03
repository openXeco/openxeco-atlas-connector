export type EntityStatus = 'draft' | 'ready_for_publication' | 'published' | 'to_be_rejected' | 'rejected'
export type SyncStatus = 'local' | 'synced' | 'pending_push' | 'failed' | 'conflict'

export interface Entity {
  id: string
  atlasId: string | null
  name: string
  nameNational: string | null
  entityDepartment: string | null
  description: string | null
  status: EntityStatus
  moderationState: EntityStatus | null
  syncStatus: SyncStatus
  countryCode: string | null
  city: string | null
  streetAddress: string | null
  postalCode: string | null
  email: string | null
  phone: string | null
  registrationNumber: string | null
  countryId: string | null
  clusterTypeId: string | null
  organizationTypeId: string | null
  logoUrl: string | null
  website: string | null
  latitude: string | null
  longitude: string | null
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
  // "Other" text fields for taxonomies
  otherSectors: string | null
  otherTechnologies: string | null
  otherUseCases: string | null
  // Consent fields
  dataProtectionConsent: boolean | null
  formCompletionConfirmed: boolean | null
  metadata: unknown
  createdAt: Date
  updatedAt: Date
  lastSyncedAt: Date | null
  createdBy: string | null
  updatedBy: string | null
}

export interface EntityVersion {
  id: string
  entityId: string
  version: string
  data: unknown
  changedBy: string | null
  createdAt: Date
}

export interface EntityFormData {
  name: string
  nameNational?: string
  entityDepartment?: string
  description?: string
  countryCode?: string
  city?: string
  streetAddress?: string
  postalCode?: string
  email?: string
  phone?: string
  registrationNumber?: string
  logoUrl?: string
  website?: string
  latitude?: number
  longitude?: number
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
  // "Other" text fields for taxonomies
  otherSectors?: string
  otherTechnologies?: string
  otherUseCases?: string
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
  // Sub-domain taxonomy relationships (hierarchical - keyed by parent domain ID)
  subDomainIds?: Record<string, string[]>
  moderationState?: EntityStatus
}

export interface EntityListParams {
  page?: number
  limit?: number
  status?: EntityStatus
  syncStatus?: SyncStatus
  search?: string
  countryId?: string
  clusterTypeId?: string
}
