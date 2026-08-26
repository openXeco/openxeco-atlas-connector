import type { AtlasJsonApiRelationship, AtlasClusterInput } from '@/actions/atlas/types.js'

const taxonomyRelationships = [
  {
    property: 'thematicAreaIds',
    field: 'field_cluster_thematic_area',
    type: 'cluster_thematic_area',
  },
  {
    property: 'sectorIds',
    field: 'field_sectors',
    type: 'sectors',
  },
  {
    property: 'technologyIds',
    field: 'field_technologies',
    type: 'technologies',
  },
  {
    property: 'useCaseIds',
    field: 'field_use_cases',
    type: 'use_cases',
  },
  {
    property: 'fieldsOfActivityIds',
    field: 'field_field_of_activity',
    type: 'fields_of_activity',
  },
] as const

export const extractIdsFromJsonRelationship = (rel: AtlasJsonApiRelationship | undefined): string[] | undefined => {
  if (!rel?.data) {
    return undefined
  }
  const data = Array.isArray(rel.data) ? rel.data : [rel.data]
  return data.length > 0 ? data.map((d) => d.id) : undefined
}

export const buildJsonApiRelationships = (data: AtlasClusterInput): Record<string, AtlasJsonApiRelationship> => {
  const manyRelationships = (key: string, ids?: string[]): AtlasJsonApiRelationship => {
    return {
      data: (ids ?? []).map((id) => ({
        type: `taxonomy_term--${key}`,
        id,
      })),
    }
  }

  const relationships: Record<string, AtlasJsonApiRelationship> = {
    field_cluster_type: {
      data: data.clusterTypeId
        ? {
            type: 'taxonomy_term--cluster_type',
            id: data.clusterTypeId,
          }
        : null,
    },
  }

  for (const { property, field, type } of taxonomyRelationships) {
    relationships[field] = manyRelationships(type, data[property])
  }

  return relationships
}
