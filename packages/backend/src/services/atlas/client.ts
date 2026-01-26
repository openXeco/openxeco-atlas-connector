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
      password: config.ATLAS_PASSWORD,
      timeout: 30000,
      ...atlasConfig,
    };
  }

  async authenticate(): Promise<void> {
    if (this.authToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return;
    }

    try {
      if (this.config.username && this.config.password) {
        const credentials = `${this.config.username}:${this.config.password}`;
        this.authToken = Buffer.from(credentials).toString('base64');
        this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        logger.info('ATLAS authenticated with Basic Auth');
      } else if (this.config.apiKey) {
        this.authToken = this.config.apiKey;
        this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        logger.info('ATLAS authenticated with API key');
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

    const baseUrl = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl
      : `${this.config.baseUrl}/`;
    const relativePath = path.startsWith('/') ? path.slice(1) : path;
    const url = new URL(relativePath, baseUrl);

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
      const authScheme = this.config.username && this.config.password ? 'Basic' : 'Bearer';
      headers.Authorization = `${authScheme} ${this.authToken}`;
    }

    logger.info(`ATLAS API request: ${method} ${url.toString()}`);

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
          // Basic information
          title: data.name, // English name *
          field_institution_name_in_nation: data.nameNational, // National language name *
          field_entity_department: data.entityDepartment,
          body: data.description,
          
          // Address (structured) *
          field_address: data.countryCode && data.city && data.streetAddress ? {
            country_code: data.countryCode,
            locality: data.city,
            address_line1: data.streetAddress,
            postal_code: data.postalCode,
          } : undefined,
          field_latitude: data.latitude,
          field_longitude: data.longitude,
          
          // Organization details
          field_general_contact_e_mail: data.email, // *
          field_phone_number: data.phone,
          field_url: data.website ? { uri: data.website } : undefined, // *
          field_registration_number: data.registrationNumber,
          field_logo: data.logoUrl,
          
          // Headquarters
          field_question_headquarter: data.isHeadquarter, // *
          field_headquarter: data.headquarterInfo,
          
          // Subsidiaries
          field_question_subsidiaries: data.hasSubsidiaries, // *
          field_subsidiaries_eu: data.subsidiariesDetails,
          field_question_majority: data.hasMajorityShares, // *
          field_majority_shares_noneu: data.majoritySharesDetails,
          
          // Compliance
          field_article_136_compliance: data.article138Compliance, // *
          field_data_sharing_consent: data.dataShareConsent, // *
          
          // Contact person / Representative
          field_first_name: data.contactFirstName, // *
          field_family_name: data.contactLastName, // *
          field_e_mail: data.contactEmail, // *
          field_position: data.contactPosition,
          field_representative_phone_numbe: data.contactPhone,
          
          // Expertise
          field_field_of_activity_descr: data.expertiseDescription, // * (max 800 chars)
          field_goals_to_achieve: data.goalsToAchieve,
          field_goals_to_contribute: data.goalsToContribute,
          
          // Workflow
          moderation_state: data.moderationState || 'draft',
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
      latitude: resource.attributes.field_latitude as number | undefined,
      longitude: resource.attributes.field_longitude as number | undefined,
      status: resource.attributes.status as string | undefined,
      metadata: resource.attributes,
    };
  }

  async updateCluster(id: string, data: Partial<ClusterInput>): Promise<Cluster> {
    logger.info(`Updating cluster: ${id}`);

    const attributes: Record<string, unknown> = {};
    
    // Basic information
    if (data.name) attributes.title = data.name;
    if (data.nameNational !== undefined) attributes.field_institution_name_in_nation = data.nameNational;
    if (data.entityDepartment !== undefined) attributes.field_entity_department = data.entityDepartment;
    if (data.description !== undefined) attributes.body = data.description;
    
    // Address (structured)
    if (data.countryCode || data.city || data.streetAddress || data.postalCode) {
      attributes.field_address = {
        ...(data.countryCode && { country_code: data.countryCode }),
        ...(data.city && { locality: data.city }),
        ...(data.streetAddress && { address_line1: data.streetAddress }),
        ...(data.postalCode && { postal_code: data.postalCode }),
      };
    }
    if (data.latitude !== undefined) attributes.field_latitude = data.latitude;
    if (data.longitude !== undefined) attributes.field_longitude = data.longitude;
    
    // Organization details
    if (data.email !== undefined) attributes.field_general_contact_e_mail = data.email;
    if (data.phone !== undefined) attributes.field_phone_number = data.phone;
    if (data.website !== undefined) attributes.field_url = { uri: data.website };
    if (data.registrationNumber !== undefined) attributes.field_registration_number = data.registrationNumber;
    if (data.logoUrl !== undefined) attributes.field_logo = data.logoUrl;
    
    // Headquarters
    if (data.isHeadquarter !== undefined) attributes.field_question_headquarter = data.isHeadquarter;
    if (data.headquarterInfo !== undefined) attributes.field_headquarter = data.headquarterInfo;
    
    // Subsidiaries
    if (data.hasSubsidiaries !== undefined) attributes.field_question_subsidiaries = data.hasSubsidiaries;
    if (data.subsidiariesDetails !== undefined) attributes.field_subsidiaries_eu = data.subsidiariesDetails;
    if (data.hasMajorityShares !== undefined) attributes.field_question_majority = data.hasMajorityShares;
    if (data.majoritySharesDetails !== undefined) attributes.field_majority_shares_noneu = data.majoritySharesDetails;
    
    // Compliance
    if (data.article138Compliance !== undefined) attributes.field_article_136_compliance = data.article138Compliance;
    if (data.dataShareConsent !== undefined) attributes.field_data_sharing_consent = data.dataShareConsent;
    
    // Contact person
    if (data.contactFirstName !== undefined) attributes.field_first_name = data.contactFirstName;
    if (data.contactLastName !== undefined) attributes.field_family_name = data.contactLastName;
    if (data.contactEmail !== undefined) attributes.field_e_mail = data.contactEmail;
    if (data.contactPosition !== undefined) attributes.field_position = data.contactPosition;
    if (data.contactPhone !== undefined) attributes.field_representative_phone_numbe = data.contactPhone;
    
    // Expertise
    if (data.expertiseDescription !== undefined) attributes.field_field_of_activity_descr = data.expertiseDescription;
    if (data.goalsToAchieve !== undefined) attributes.field_goals_to_achieve = data.goalsToAchieve;
    if (data.goalsToContribute !== undefined) attributes.field_goals_to_contribute = data.goalsToContribute;
    
    // Workflow
    if (data.moderationState !== undefined) attributes.moderation_state = data.moderationState;

    const body = {
      data: {
        type: 'node--cluster',
        id,
        attributes,
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

    // Country reference
    if (data.countryId) {
      relationships.field_country = {
        data: { type: 'taxonomy_term--country', id: data.countryId },
      };
    }

    // Organization type (cluster_type) *
    if (data.clusterTypeId) {
      relationships.field_cluster_type = {
        data: { type: 'taxonomy_term--cluster_type', id: data.clusterTypeId },
      };
    }

    // Organization type taxonomy
    if (data.organizationTypeId) {
      relationships.field_organization_type = {
        data: { type: 'taxonomy_term--organization_type', id: data.organizationTypeId },
      };
    }

    // JRC Cybersecurity Taxonomy - Knowledge domains (thematic areas)
    if (data.thematicAreaIds && data.thematicAreaIds.length > 0) {
      relationships.field_cluster_thematic_area = {
        data: data.thematicAreaIds.map((id: string) => ({
          type: 'taxonomy_term--cluster_thematic_area',
          id,
        })),
      };
    }

    // JRC Cybersecurity Taxonomy - Sectors
    if (data.sectorIds && data.sectorIds.length > 0) {
      relationships.field_sectors = {
        data: data.sectorIds.map((id: string) => ({
          type: 'taxonomy_term--sectors',
          id,
        })),
      };
    }

    // JRC Cybersecurity Taxonomy - Technologies
    if (data.technologyIds && data.technologyIds.length > 0) {
      relationships.field_technologies = {
        data: data.technologyIds.map((id: string) => ({
          type: 'taxonomy_term--technologies',
          id,
        })),
      };
    }

    // JRC Cybersecurity Taxonomy - Use cases
    if (data.useCaseIds && data.useCaseIds.length > 0) {
      relationships.field_use_cases = {
        data: data.useCaseIds.map((id: string) => ({
          type: 'taxonomy_term--use_cases',
          id,
        })),
      };
    }

    // Article 8(3) expertise (fields of activity) *
    if (data.fieldsOfActivityIds && data.fieldsOfActivityIds.length > 0) {
      relationships.field_field_of_activity = {
        data: data.fieldsOfActivityIds.map((id: string) => ({
          type: 'taxonomy_term--fields_of_activity',
          id,
        })),
      };
    }

    return relationships;
  }
}

export const atlasClient = new AtlasClient();
