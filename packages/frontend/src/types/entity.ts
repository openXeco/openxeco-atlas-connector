export type EntityStatus = 'draft' | 'pending' | 'published' | 'rejected';
export type SyncStatus = 'local' | 'synced' | 'pending_push' | 'failed' | 'conflict';

export interface Entity {
  id: string;
  atlasId: string | null;
  name: string;
  description: string | null;
  status: EntityStatus;
  syncStatus: SyncStatus;
  countryId: string | null;
  clusterTypeId: string | null;
  legalStatusId: string | null;
  organizationTypeId: string | null;
  logoUrl: string | null;
  website: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface EntityVersion {
  id: string;
  entityId: string;
  version: string;
  data: unknown;
  changedBy: string | null;
  createdAt: Date;
}

export interface EntityFormData {
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  countryId?: string;
  clusterTypeId?: string;
  legalStatusId?: string;
  organizationTypeId?: string;
}

export interface EntityListParams {
  page?: number;
  limit?: number;
  status?: EntityStatus;
  syncStatus?: SyncStatus;
  search?: string;
  countryId?: string;
  clusterTypeId?: string;
}
