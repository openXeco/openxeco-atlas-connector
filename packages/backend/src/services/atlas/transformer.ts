import type { Entity, Taxonomy } from '../../db/schema.js';
import type {
  JsonApiDocument,
  JsonApiResource,
  JsonApiRelationship,
  Cluster,
  ClusterInput,
  TaxonomyTerm,
} from './types.js';

export class JsonApiTransformer {
  toJsonApiCluster(entity: Entity, taxonomies?: Taxonomy[]): JsonApiDocument {
    const relationships: Record<string, JsonApiRelationship> = {};

    if (entity.countryId) {
      relationships.field_country = {
        data: {
          type: 'taxonomy_term--country',
          id: entity.countryId,
        },
      };
    }

    if (entity.clusterTypeId) {
      relationships.field_cluster_type = {
        data: {
          type: 'taxonomy_term--cluster_type',
          id: entity.clusterTypeId,
        },
      };
    }

    if (entity.organizationTypeId) {
      relationships.field_organization_type = {
        data: {
          type: 'taxonomy_term--organization_type',
          id: entity.organizationTypeId,
        },
      };
    }

    if (taxonomies && taxonomies.length > 0) {
      relationships.field_taxonomies = {
        data: taxonomies.map((tax) => ({
          type: `taxonomy_term--${tax.taxonomyType}`,
          id: tax.atlasId || tax.id,
        })),
      };
    }

    const resource: JsonApiResource = {
      type: 'node--cluster',
      id: entity.atlasId || entity.id,
      attributes: {
        title: entity.name,
        body: entity.description || '',
        field_logo: entity.logoUrl,
        field_website: entity.website,
        field_latitude: entity.latitude ? parseFloat(entity.latitude) : undefined,
        field_longitude: entity.longitude ? parseFloat(entity.longitude) : undefined,
        status: entity.status,
      },
      relationships,
    };

    return {
      data: resource,
    };
  }

  fromJsonApiCluster(document: JsonApiDocument): Cluster {
    if (!document.data || Array.isArray(document.data)) {
      throw new Error('Invalid JSON:API document for cluster');
    }

    const resource = document.data;
    const attrs = resource.attributes;

    const cluster: Cluster = {
      id: resource.id,
      atlasId: resource.id,
      name: (attrs.title as string) || (attrs.name as string) || '',
      description: attrs.body as string | undefined,
      logoUrl: attrs.field_logo as string | undefined,
      website: attrs.field_website as string | undefined,
      latitude: attrs.field_latitude as number | undefined,
      longitude: attrs.field_longitude as number | undefined,
      status: attrs.status as string | undefined,
      metadata: attrs,
    };

    if (resource.relationships) {
      const rels = resource.relationships;

      if (rels.field_country?.data && !Array.isArray(rels.field_country.data)) {
        cluster.countryId = rels.field_country.data.id;
      }

      if (rels.field_cluster_type?.data && !Array.isArray(rels.field_cluster_type.data)) {
        cluster.clusterTypeId = rels.field_cluster_type.data.id;
      }

      if (rels.field_organization_type?.data && !Array.isArray(rels.field_organization_type.data)) {
        cluster.organizationTypeId = rels.field_organization_type.data.id;
      }
    }

    return cluster;
  }

  fromJsonApiClusters(document: JsonApiDocument): Cluster[] {
    if (!document.data) {
      return [];
    }

    const resources = Array.isArray(document.data) ? document.data : [document.data];

    return resources.map((resource) => this.fromJsonApiCluster({ data: resource }));
  }

  toEntityFromCluster(cluster: Cluster, userId?: string): Partial<Entity> {
    return {
      atlasId: cluster.atlasId,

      // Basic information
      name: cluster.name,
      nameNational: cluster.nameNational,
      entityDepartment: cluster.entityDepartment,
      description: cluster.description,

      // Address (structured)
      countryCode: cluster.countryCode,
      city: cluster.city,
      streetAddress: cluster.streetAddress,
      postalCode: cluster.postalCode,
      latitude: cluster.latitude?.toString(),
      longitude: cluster.longitude?.toString(),

      // Organization details
      email: cluster.email,
      phone: cluster.phone,
      website: cluster.website,
      registrationNumber: cluster.registrationNumber,
      logoUrl: cluster.logoUrl,

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
      organizationTypeId: cluster.organizationTypeId,

      // Workflow
      status: cluster.status || 'draft',
      moderationState: cluster.moderationState || 'draft',
      syncStatus: 'synced',

      metadata: cluster.metadata,
      lastSyncedAt: new Date(),
      updatedBy: userId,
    };
  }

  toClusterInputFromEntity(entity: Entity): ClusterInput {
    return {
      // Basic information
      name: entity.name,
      nameNational: entity.nameNational || undefined,
      entityDepartment: entity.entityDepartment || undefined,
      description: entity.description || undefined,

      // Address (structured)
      countryCode: entity.countryCode || undefined,
      city: entity.city || undefined,
      streetAddress: entity.streetAddress || undefined,
      postalCode: entity.postalCode || undefined,
      latitude: entity.latitude ? parseFloat(entity.latitude) : undefined,
      longitude: entity.longitude ? parseFloat(entity.longitude) : undefined,

      // Organization details
      email: entity.email || undefined,
      phone: entity.phone || undefined,
      website: entity.website || undefined,
      registrationNumber: entity.registrationNumber || undefined,
      logoUrl: entity.logoUrl || undefined,

      // Headquarters
      isHeadquarter: entity.isHeadquarter ?? undefined,
      headquarterInfo: entity.headquarterInfo || undefined,

      // Subsidiaries
      hasSubsidiaries: entity.hasSubsidiaries ?? undefined,
      subsidiariesDetails: entity.subsidiariesDetails || undefined,
      hasMajorityShares: entity.hasMajorityShares ?? undefined,
      majoritySharesDetails: entity.majoritySharesDetails || undefined,

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
      countryId: entity.countryId || undefined,
      clusterTypeId: entity.clusterTypeId || undefined,
      organizationTypeId: entity.organizationTypeId || undefined,

      // Workflow
      moderationState: entity.moderationState || undefined,
    };
  }

  fromJsonApiTaxonomy(resource: JsonApiResource, type: string): TaxonomyTerm {
    return {
      id: resource.id,
      atlasId: resource.id,
      type: type as any,
      name: (resource.attributes.name as string) || '',
      description: resource.attributes.description as string | undefined,
      parentId: resource.relationships?.parent?.data
        ? (resource.relationships.parent.data as { id: string }).id
        : undefined,
      metadata: resource.attributes,
    };
  }

  toTaxonomyFromTerm(term: TaxonomyTerm): Partial<Taxonomy> {
    return {
      atlasId: term.atlasId,
      taxonomyType: term.type,
      name: term.name,
      description: term.description,
      parentId: term.parentId,
      metadata: term.metadata,
      lastSyncedAt: new Date(),
    };
  }

  extractIncludedResources(document: JsonApiDocument, type: string): JsonApiResource[] {
    if (!document.included) {
      return [];
    }

    return document.included.filter((resource) => resource.type === type);
  }

  buildRelationshipData(
    taxonomyIds: Record<string, string[]>
  ): Record<string, JsonApiRelationship> {
    const relationships: Record<string, JsonApiRelationship> = {};

    Object.entries(taxonomyIds).forEach(([field, ids]) => {
      if (ids.length === 1) {
        relationships[field] = {
          data: {
            type: `taxonomy_term--${field.replace('field_', '')}`,
            id: ids[0],
          },
        };
      } else if (ids.length > 1) {
        relationships[field] = {
          data: ids.map((id) => ({
            type: `taxonomy_term--${field.replace('field_', '')}`,
            id,
          })),
        };
      }
    });

    return relationships;
  }
}

export const jsonApiTransformer = new JsonApiTransformer();
