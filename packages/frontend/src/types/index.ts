export interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Taxonomy {
  id: string;
  atlasId: string | null;
  taxonomyType: string;
  name: string;
  description: string | null;
  parentId: string | null;
  metadata: Record<string, unknown> | null;
  lastSyncedAt: string;
}

export interface Entity {
  id: string;
  atlasId: string | null;
  name: string;
  nameNational: string | null;
  entityDepartment: string | null;
  description: string | null;
  status: 'draft' | 'ready_for_publication' | 'published' | 'to_be_rejected' | 'rejected';
  moderationState: 'draft' | 'ready_for_publication' | 'published' | 'to_be_rejected' | 'rejected' | null;
  syncStatus: 'local' | 'synced' | 'pending_push' | 'failed' | 'conflict';
  countryCode: string | null;
  city: string | null;
  streetAddress: string | null;
  postalCode: string | null;
  email: string | null;
  phone: string | null;
  registrationNumber: string | null;
  countryId: string | null;
  clusterTypeId: string | null;
  organizationTypeId: string | null;
  logoUrl: string | null;
  website: string | null;
  latitude: string | null;
  longitude: string | null;
  isHeadquarter: boolean | null;
  headquarterInfo: string | null;
  hasSubsidiaries: boolean | null;
  subsidiariesDetails: string | null;
  hasMajorityShares: boolean | null;
  majoritySharesDetails: string | null;
  article138Compliance: boolean | null;
  dataShareConsent: boolean | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  contactEmail: string | null;
  contactPosition: string | null;
  contactPhone: string | null;
  expertiseDescription: string | null;
  goalsToAchieve: string | null;
  goalsToContribute: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    database: 'ok' | 'error';
  };
}
