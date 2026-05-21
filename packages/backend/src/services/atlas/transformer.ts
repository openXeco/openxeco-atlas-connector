import type { Entity, Taxonomy } from '@/db/schema.js'
import type {
  JsonApiAddress,
  JsonApiDocument,
  JsonApiResource,
  JsonApiRelationship,
  Cluster,
  ClusterInput,
  TaxonomyTerm,
  JsonApiWebsite,
  TaxonomyType,
} from './types.js'

function str(val: unknown): string | undefined {
  return typeof val === 'string' ? val : undefined
}

function bool(val: unknown): boolean | undefined {
  return typeof val === 'boolean' ? val : undefined
}

/**
 * Maps a JSON:API resource to a Cluster object, extracting ALL attributes and relationships.
 * Used as the single source of truth for parsing ATLAS API responses.
 */
export function mapResourceToCluster(resource: JsonApiResource): Cluster {
  const attrs = resource.attributes

  // Extract structured address (may be null or an object)
  const address = attrs.field_address as JsonApiAddress

  // Extract website URL (may be { uri: string } or a plain string)
  const websiteField = attrs.field_url as JsonApiWebsite
  const website =
    typeof websiteField === 'object' && websiteField !== null ? websiteField.uri : str(websiteField)

  const cluster: Cluster = {
    id: resource.id,
    atlasId: resource.id,

    // Basic information
    name: str(attrs.title) || str(attrs.name) || '',
    nameNational: str(attrs.field_institution_name_in_nation),
    entityDepartment: str(attrs.field_entity_department),

    // Address
    countryCode: address?.country_code,
    city: address?.locality,
    streetAddress: address?.address_line1,

    // Organisation details
    email: str(attrs.field_general_contact_e_mail),
    phone: str(attrs.field_phone_number),
    website,
    registrationNumber: str(attrs.field_registration_number),

    // Headquarters
    isHeadquarter: bool(attrs.field_question_headquarter),
    headquarterInfo: str(attrs.field_headquarter),

    // Subsidiaries
    hasSubsidiaries: bool(attrs.field_question_subsidiaries),
    subsidiariesDetails: str(attrs.field_subsidiaries_eu),
    hasMajorityShares: bool(attrs.field_question_majority),
    majoritySharesDetails: str(attrs.field_majority_shares_noneu),

    // Compliance
    article138Compliance: bool(attrs.field_article_136_compliance),
    dataShareConsent: bool(attrs.field_data_sharing_consent),

    // Contact person
    contactFirstName: str(attrs.field_first_name),
    contactLastName: str(attrs.field_family_name),
    contactEmail: str(attrs.field_e_mail),
    contactPosition: str(attrs.field_position),
    contactPhone: str(attrs.field_representative_phone_numbe),

    // Expertise
    expertiseDescription: str(attrs.field_field_of_activity_descr),
    goalsToAchieve: str(attrs.field_goals_to_achieve),
    goalsToContribute: str(attrs.field_goals_to_contribute),

    // Workflow
    status: str(attrs.status),
    moderationState: str(attrs.moderation_state),

    // Timestamps
    updatedAt: str(attrs.changed),

    metadata: attrs,
  }

  // Extract relationships
  if (resource.relationships) {
    const rels = resource.relationships

    // Single-value relationships
    if (rels.field_country?.data && !Array.isArray(rels.field_country.data)) {
      cluster.countryId = rels.field_country.data.id
    }
    if (rels.field_cluster_type?.data && !Array.isArray(rels.field_cluster_type.data)) {
      cluster.clusterTypeId = rels.field_cluster_type.data.id
    }
    // Multi-value relationships (JRC taxonomy)
    const extractIds = (rel: JsonApiRelationship | undefined): string[] | undefined => {
      if (!rel?.data) return undefined
      const data = Array.isArray(rel.data) ? rel.data : [rel.data]
      return data.length > 0 ? data.map((d) => d.id) : undefined
    }

    cluster.thematicAreaIds = extractIds(rels.field_cluster_thematic_area)
    cluster.sectorIds = extractIds(rels.field_sectors)
    cluster.technologyIds = extractIds(rels.field_technologies)
    cluster.useCaseIds = extractIds(rels.field_use_cases)
    cluster.fieldsOfActivityIds = extractIds(rels.field_field_of_activity)
  }

  return cluster
}

export class JsonApiTransformer {
  toJsonApiCluster(entity: Entity, taxonomies?: Taxonomy[]): JsonApiDocument {
    const relationships: Record<string, JsonApiRelationship> = {}

    if (entity.clusterTypeId) {
      relationships.field_cluster_type = {
        data: {
          type: 'taxonomy_term--cluster_type',
          id: entity.clusterTypeId,
        },
      }
    }

    if (taxonomies && taxonomies.length > 0) {
      relationships.field_taxonomies = {
        data: taxonomies.map((tax) => ({
          type: `taxonomy_term--${tax.taxonomyType}`,
          id: tax.atlasId || tax.id,
        })),
      }
    }

    const resource: JsonApiResource = {
      type: 'node--cluster',
      id: entity.atlasId || entity.id,
      attributes: {
        title: entity.name,
        body: '', // @TODO keeping for ATLAS compatibility / check if it works removing it
        field_website: entity.website,
        status: entity.status,
      },
      relationships,
    }

    return {
      data: resource,
    }
  }

  fromJsonApiCluster(document: JsonApiDocument): Cluster {
    if (!document.data || Array.isArray(document.data)) {
      throw new Error('Invalid JSON:API document for cluster')
    }

    return mapResourceToCluster(document.data)
  }

  fromJsonApiClusters(document: JsonApiDocument): Cluster[] {
    if (!document.data) {
      return []
    }

    const resources = Array.isArray(document.data) ? document.data : [document.data]

    return resources.map((resource) => this.fromJsonApiCluster({ data: resource }))
  }

  toEntityFromCluster(cluster: Cluster): Partial<Entity> {
    return {
      atlasId: cluster.atlasId,

      // Basic information
      name: cluster.name,
      nameNational: cluster.nameNational,
      entityDepartment: cluster.entityDepartment,

      // Address (structured)
      countryCode: cluster.countryCode,
      city: cluster.city,
      streetAddress: cluster.streetAddress,

      // Organisation details
      email: cluster.email,
      phone: cluster.phone,
      website: cluster.website,
      registrationNumber: cluster.registrationNumber,

      // Headquarters
      isHeadquarter: cluster.isHeadquarter,
      headquarterInfo: cluster.headquarterInfo,

      // Subsidiaries
      hasSubsidiaries: cluster.hasSubsidiaries,
      subsidiariesDetails: cluster.subsidiariesDetails,
      hasMajorityShares: cluster.hasMajorityShares,
      majoritySharesDetails: cluster.majoritySharesDetails,

      // Compliance
      article138Compliance: cluster.article138Compliance,
      dataShareConsent: cluster.dataShareConsent,

      // Contact person
      contactFirstName: cluster.contactFirstName,
      contactLastName: cluster.contactLastName,
      contactEmail: cluster.contactEmail,
      contactPosition: cluster.contactPosition,
      contactPhone: cluster.contactPhone,

      // Expertise
      expertiseDescription: cluster.expertiseDescription,
      goalsToAchieve: cluster.goalsToAchieve,
      goalsToContribute: cluster.goalsToContribute,

      // Taxonomy references
      countryId: cluster.countryId,
      clusterTypeId: cluster.clusterTypeId,

      // Workflow
      status: cluster.status || 'draft',
      moderationState: cluster.moderationState || 'draft',
      syncStatus: 'synced',

      metadata: cluster.metadata,
      lastSyncedAt: new Date(),
    }
  }

  toClusterInputFromEntity(
    entity: Entity,
    clusterTypeId?: string,
    taxonomyIds?: {
      thematicAreaIds?: string[]
      sectorIds?: string[]
      technologyIds?: string[]
      useCaseIds?: string[]
      fieldsOfActivityIds?: string[]
    },
  ): ClusterInput {
    return {
      // Basic information
      name: entity.name,
      nameNational: entity.nameNational || undefined,
      entityDepartment: entity.entityDepartment || undefined,

      // Address (structured)
      countryCode: entity.countryCode || undefined,
      city: entity.city || undefined,
      streetAddress: entity.streetAddress || undefined,

      // Organisation details
      email: entity.email || undefined,
      phone: entity.phone || undefined,
      website: entity.website || undefined,
      registrationNumber: entity.registrationNumber || undefined,

      // Headquarters
      isHeadquarter: entity.isHeadquarter ?? undefined,
      headquarterInfo: entity.headquarterInfo || undefined,

      // Subsidiaries
      hasSubsidiaries: entity.hasSubsidiaries ?? undefined,
      subsidiariesDetails: entity.subsidiariesDetails || undefined,
      hasMajorityShares: entity.hasMajorityShares ?? undefined,
      majoritySharesDetails:
        entity.hasMajorityShares && entity.majoritySharesDetails ? entity.majoritySharesDetails : undefined,

      // Compliance
      article138Compliance: entity.article138Compliance ?? undefined,
      dataShareConsent: entity.dataShareConsent ?? undefined,

      // Contact person
      contactFirstName: entity.contactFirstName || undefined,
      contactLastName: entity.contactLastName || undefined,
      contactEmail: entity.contactEmail || undefined,
      contactPosition: entity.contactPosition || undefined,
      contactPhone: entity.contactPhone || undefined,

      // Expertise
      expertiseDescription: entity.expertiseDescription || undefined,
      goalsToAchieve: entity.goalsToAchieve || undefined,
      goalsToContribute: entity.goalsToContribute || undefined,

      // Taxonomy references
      clusterTypeId,
      thematicAreaIds: taxonomyIds?.thematicAreaIds,
      sectorIds: taxonomyIds?.sectorIds,
      technologyIds: taxonomyIds?.technologyIds,
      useCaseIds: taxonomyIds?.useCaseIds,
      fieldsOfActivityIds: taxonomyIds?.fieldsOfActivityIds,

      // Workflow
      moderationState: entity.moderationState || undefined,
    }
  }

  fromJsonApiTaxonomy(resource: JsonApiResource, type: string): TaxonomyTerm {
    return {
      id: resource.id,
      atlasId: resource.id,
      type: type as TaxonomyType,
      name: (resource.attributes.name as string) || '',
      description: resource.attributes.description as string | undefined,
      parentId: resource.relationships?.parent?.data
        ? (resource.relationships.parent.data as { id: string }).id
        : undefined,
      metadata: resource.attributes,
    }
  }

  toTaxonomyFromTerm(term: TaxonomyTerm): Omit<Taxonomy, 'id'> {
    return {
      atlasId: term.atlasId,
      taxonomyType: term.type,
      name: term.name,
      description: term.description || '',
      parentId: term.parentId || null,
      metadata: term.metadata,
      lastSyncedAt: new Date(),
    }
  }

  extractIncludedResources(document: JsonApiDocument, type: string): JsonApiResource[] {
    if (!document.included) {
      return []
    }

    return document.included.filter((resource) => resource.type === type)
  }

  buildRelationshipData(taxonomyIds: Record<string, string[]>): Record<string, JsonApiRelationship> {
    const relationships: Record<string, JsonApiRelationship> = {}

    Object.entries(taxonomyIds).forEach(([field, ids]) => {
      if (ids.length === 1) {
        relationships[field] = {
          data: {
            type: `taxonomy_term--${field.replace('field_', '')}`,
            id: ids[0],
          },
        }
      } else if (ids.length > 1) {
        relationships[field] = {
          data: ids.map((id) => ({
            type: `taxonomy_term--${field.replace('field_', '')}`,
            id,
          })),
        }
      }
    })

    return relationships
  }
}

export const jsonApiTransformer = new JsonApiTransformer()
