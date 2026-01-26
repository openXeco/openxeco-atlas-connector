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
  description: string | null;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  syncStatus: 'local' | 'synced' | 'pending_push' | 'conflict';
  countryId: string | null;
  clusterTypeId: string | null;
  legalStatusId: string | null;
  organizationTypeId: string | null;
  logoUrl: string | null;
  website: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
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
