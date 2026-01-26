export interface JsonApiResource {
  type: string;
  id: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, JsonApiRelationship>;
  links?: Record<string, string>;
}

export interface JsonApiRelationship {
  data?: JsonApiResourceIdentifier | JsonApiResourceIdentifier[] | null;
  links?: Record<string, string>;
}

export interface JsonApiResourceIdentifier {
  type: string;
  id: string;
}

export interface JsonApiDocument<T = JsonApiResource> {
  data?: T | T[] | null;
  included?: JsonApiResource[];
  meta?: Record<string, unknown>;
  links?: Record<string, string>;
  errors?: JsonApiError[];
}

export interface JsonApiError {
  id?: string;
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  source?: {
    pointer?: string;
    parameter?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
  links?: {
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
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
  | 'citations_source';

export interface TaxonomyTerm {
  id: string;
  atlasId: string;
  type: TaxonomyType;
  name: string;
  description?: string;
  parentId?: string;
  metadata?: Record<string, unknown>;
}

export interface ClusterAttributes {
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  [key: string]: unknown;
}

export interface Cluster {
  id: string;
  atlasId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  countryId?: string;
  clusterTypeId?: string;
  legalStatusId?: string;
  organizationTypeId?: string;
  metadata?: Record<string, unknown>;
}

export interface ClusterInput {
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
  taxonomyIds?: string[];
}

export interface AtlasConfig {
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  timeout?: number;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  filter?: Record<string, string>;
  include?: string[];
  sort?: string;
}
