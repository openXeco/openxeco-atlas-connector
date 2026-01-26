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
  toJsonApiCluster(
    entity: Entity,
    taxonomies?: Taxonomy[]
  ): JsonApiDocument {
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

    if (entity.legalStatusId) {
      relationships.field_legal_status = {
        data: {
          type: 'taxonomy_term--legal_status',
          id: entity.legalStatusId,
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
        field_address: entity.address,
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
      address: attrs.field_address as string | undefined,
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

      if (rels.field_legal_status?.data && !Array.isArray(rels.field_legal_status.data)) {
        cluster.legalStatusId = rels.field_legal_status.data.id;
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

    return resources.map((resource) =>
      this.fromJsonApiCluster({ data: resource })
    );
  }

  toEntityFromCluster(cluster: Cluster, userId?: string): Partial<Entity> {
    return {
      atlasId: cluster.atlasId,
      name: cluster.name,
      description: cluster.description,
      status: cluster.status || 'draft',
      syncStatus: 'synced',
      countryId: cluster.countryId,
      clusterTypeId: cluster.clusterTypeId,
      legalStatusId: cluster.legalStatusId,
      organizationTypeId: cluster.organizationTypeId,
      logoUrl: cluster.logoUrl,
      website: cluster.website,
      address: cluster.address,
      latitude: cluster.latitude?.toString(),
      longitude: cluster.longitude?.toString(),
      metadata: cluster.metadata,
      lastSyncedAt: new Date(),
      updatedBy: userId,
    };
  }

  toClusterInputFromEntity(entity: Entity): ClusterInput {
    return {
      name: entity.name,
      description: entity.description || undefined,
      logoUrl: entity.logoUrl || undefined,
      website: entity.website || undefined,
      address: entity.address || undefined,
      latitude: entity.latitude ? parseFloat(entity.latitude) : undefined,
      longitude: entity.longitude ? parseFloat(entity.longitude) : undefined,
      countryId: entity.countryId || undefined,
      clusterTypeId: entity.clusterTypeId || undefined,
      legalStatusId: entity.legalStatusId || undefined,
      organizationTypeId: entity.organizationTypeId || undefined,
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

  extractIncludedResources(
    document: JsonApiDocument,
    type: string
  ): JsonApiResource[] {
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
