import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import type {
  AtlasConfig,
  JsonApiDocument,
  JsonApiResource,
  TaxonomyType,
  TaxonomyTerm,
  Cluster,
  ClusterInput,
  QueryParams,
  PaginatedResponse,
} from './types.js';

export class AtlasClient {
  private config: AtlasConfig;
  private authToken?: string;
  private tokenExpiry?: Date;

  constructor(atlasConfig?: Partial<AtlasConfig>) {
    this.config = {
      baseUrl: config.ATLAS_BASE_URL,
      apiKey: config.ATLAS_API_KEY,
      username: config.ATLAS_USERNAME,
      timeout: 30000,
      ...atlasConfig,
    };
  }

  async authenticate(): Promise<void> {
    if (this.authToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return;
    }

    try {
      if (this.config.apiKey) {
        this.authToken = this.config.apiKey;
        this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        logger.info('ATLAS authenticated with API key');
      } else if (this.config.username) {
        logger.warn('Username-based auth not yet implemented, using public access');
      } else {
        logger.info('Using ATLAS public access (no authentication)');
      }
    } catch (error) {
      logger.error('ATLAS authentication failed:', error as Error);
      throw new Error('Failed to authenticate with ATLAS API');
    }
  }

  private async request<T = JsonApiResource>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      params?: QueryParams;
    }
  ): Promise<JsonApiDocument<T>> {
    await this.authenticate();

    const url = new URL(path, this.config.baseUrl);

    if (options?.params) {
      if (options.params.page) {
        url.searchParams.set('page[number]', String(options.params.page));
      }
      if (options.params.pageSize) {
        url.searchParams.set('page[size]', String(options.params.pageSize));
      }
      if (options.params.filter) {
        Object.entries(options.params.filter).forEach(([key, value]) => {
          url.searchParams.set(`filter[${key}]`, value);
        });
      }
      if (options.params.include) {
        url.searchParams.set('include', options.params.include.join(','));
      }
      if (options.params.sort) {
        url.searchParams.set('sort', options.params.sort);
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: AbortSignal.timeout(this.config.timeout || 30000),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as JsonApiDocument;
        logger.error('ATLAS API error:', {
          status: response.status,
          statusText: response.statusText,
          errors: errorData.errors || [],
        });
        throw new Error(
          `ATLAS API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json() as JsonApiDocument<T>;

      if (data.errors && data.errors.length > 0) {
        logger.error('ATLAS API returned errors:', { errors: data.errors });
        throw new Error(`ATLAS API error: ${data.errors[0].title || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('ATLAS API request timeout');
        }
        throw error;
      }
      throw new Error('Unknown error occurred during ATLAS API request');
    }
  }

  async getTaxonomies(type: TaxonomyType): Promise<TaxonomyTerm[]> {
    logger.info(`Fetching taxonomies of type: ${type}`);

    const response = await this.request<JsonApiResource>(
      'GET',
      `/taxonomy_term/${type}`
    );

    if (!response.data) {
      return [];
    }

    const resources = Array.isArray(response.data) ? response.data : [response.data];

    return resources.map((resource) => ({
      id: resource.id,
      atlasId: resource.id,
      type,
      name: (resource.attributes.name as string) || '',
      description: resource.attributes.description as string | undefined,
      parentId: resource.relationships?.parent?.data
        ? (resource.relationships.parent.data as { id: string }).id
        : undefined,
      metadata: resource.attributes,
    }));
  }

  async getTaxonomy(type: TaxonomyType, id: string): Promise<TaxonomyTerm> {
    logger.info(`Fetching taxonomy: ${type}/${id}`);

    const response = await this.request<JsonApiResource>(
      'GET',
      `/taxonomy_term/${type}/${id}`
    );

    if (!response.data || Array.isArray(response.data)) {
      throw new Error('Taxonomy not found');
    }

    const resource = response.data;

    return {
      id: resource.id,
      atlasId: resource.id,
      type,
      name: (resource.attributes.name as string) || '',
      description: resource.attributes.description as string | undefined,
      parentId: resource.relationships?.parent?.data
        ? (resource.relationships.parent.data as { id: string }).id
        : undefined,
      metadata: resource.attributes,
    };
  }

  async getClusters(params?: QueryParams): Promise<PaginatedResponse<Cluster>> {
    logger.info('Fetching clusters from ATLAS');

    const response = await this.request<JsonApiResource>(
      'GET',
      '/node/cluster',
      { params }
    );

    if (!response.data) {
      return {
        data: [],
        meta: { total: 0, page: 1, pageSize: 10 },
      };
    }

    const resources = Array.isArray(response.data) ? response.data : [response.data];

    const clusters: Cluster[] = resources.map((resource) => ({
      id: resource.id,
      atlasId: resource.id,
      name: (resource.attributes.title as string) || (resource.attributes.name as string) || '',
      description: resource.attributes.body as string | undefined,
      logoUrl: resource.attributes.field_logo as string | undefined,
      website: resource.attributes.field_website as string | undefined,
      address: resource.attributes.field_address as string | undefined,
      latitude: resource.attributes.field_latitude as number | undefined,
      longitude: resource.attributes.field_longitude as number | undefined,
      status: resource.attributes.status as string | undefined,
      metadata: resource.attributes,
    }));

    return {
      data: clusters,
      meta: {
        total: (response.meta?.count as number) || clusters.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 10,
      },
      links: response.links,
    };
  }

  async getCluster(id: string): Promise<Cluster> {
    logger.info(`Fetching cluster: ${id}`);

    const response = await this.request<JsonApiResource>(
      'GET',
      `/node/cluster/${id}`
    );

    if (!response.data || Array.isArray(response.data)) {
      throw new Error('Cluster not found');
    }

    const resource = response.data;

    return {
      id: resource.id,
      atlasId: resource.id,
      name: (resource.attributes.title as string) || (resource.attributes.name as string) || '',
      description: resource.attributes.body as string | undefined,
      logoUrl: resource.attributes.field_logo as string | undefined,
      website: resource.attributes.field_website as string | undefined,
      address: resource.attributes.field_address as string | undefined,
      latitude: resource.attributes.field_latitude as number | undefined,
      longitude: resource.attributes.field_longitude as number | undefined,
      status: resource.attributes.status as string | undefined,
      metadata: resource.attributes,
    };
  }

  async createCluster(data: ClusterInput): Promise<Cluster> {
    logger.info('Creating cluster in ATLAS');

    const body = {
      data: {
        type: 'node--cluster',
        attributes: {
          title: data.name,
          body: data.description,
          field_logo: data.logoUrl,
          field_website: data.website,
          field_address: data.address,
          field_latitude: data.latitude,
          field_longitude: data.longitude,
        },
        relationships: this.buildRelationships(data),
      },
    };

    const response = await this.request<JsonApiResource>(
      'POST',
      '/node/cluster',
      { body }
    );

    if (!response.data || Array.isArray(response.data)) {
      throw new Error('Failed to create cluster');
    }

    const resource = response.data;

    return {
      id: resource.id,
      atlasId: resource.id,
      name: (resource.attributes.title as string) || '',
      description: resource.attributes.body as string | undefined,
      logoUrl: resource.attributes.field_logo as string | undefined,
      website: resource.attributes.field_website as string | undefined,
      address: resource.attributes.field_address as string | undefined,
      latitude: resource.attributes.field_latitude as number | undefined,
      longitude: resource.attributes.field_longitude as number | undefined,
      status: resource.attributes.status as string | undefined,
      metadata: resource.attributes,
    };
  }

  async updateCluster(id: string, data: Partial<ClusterInput>): Promise<Cluster> {
    logger.info(`Updating cluster: ${id}`);

    const body = {
      data: {
        type: 'node--cluster',
        id,
        attributes: {
          ...(data.name && { title: data.name }),
          ...(data.description && { body: data.description }),
          ...(data.logoUrl && { field_logo: data.logoUrl }),
          ...(data.website && { field_website: data.website }),
          ...(data.address && { field_address: data.address }),
          ...(data.latitude && { field_latitude: data.latitude }),
          ...(data.longitude && { field_longitude: data.longitude }),
        },
        relationships: this.buildRelationships(data),
      },
    };

    const response = await this.request<JsonApiResource>(
      'PATCH',
      `/node/cluster/${id}`,
      { body }
    );

    if (!response.data || Array.isArray(response.data)) {
      throw new Error('Failed to update cluster');
    }

    const resource = response.data;

    return {
      id: resource.id,
      atlasId: resource.id,
      name: (resource.attributes.title as string) || '',
      description: resource.attributes.body as string | undefined,
      logoUrl: resource.attributes.field_logo as string | undefined,
      website: resource.attributes.field_website as string | undefined,
      address: resource.attributes.field_address as string | undefined,
      latitude: resource.attributes.field_latitude as number | undefined,
      longitude: resource.attributes.field_longitude as number | undefined,
      status: resource.attributes.status as string | undefined,
      metadata: resource.attributes,
    };
  }

  private buildRelationships(data: Partial<ClusterInput>): Record<string, unknown> {
    const relationships: Record<string, unknown> = {};

    if (data.countryId) {
      relationships.field_country = {
        data: { type: 'taxonomy_term--country', id: data.countryId },
      };
    }

    if (data.clusterTypeId) {
      relationships.field_cluster_type = {
        data: { type: 'taxonomy_term--cluster_type', id: data.clusterTypeId },
      };
    }

    if (data.legalStatusId) {
      relationships.field_legal_status = {
        data: { type: 'taxonomy_term--legal_status', id: data.legalStatusId },
      };
    }

    if (data.organizationTypeId) {
      relationships.field_organization_type = {
        data: { type: 'taxonomy_term--organization_type', id: data.organizationTypeId },
      };
    }

    if (data.taxonomyIds && data.taxonomyIds.length > 0) {
      relationships.field_taxonomies = {
        data: data.taxonomyIds.map((id) => ({
          type: 'taxonomy_term',
          id,
        })),
      };
    }

    return relationships;
  }
}

export const atlasClient = new AtlasClient();
