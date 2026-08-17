import type { AtlasJsonApiResource, AtlasTaxonomyTerm } from '@/actions/atlas/types.js'
import type { TaxonomyType } from '@/types.js'
import type { Taxonomy } from '@/db/schema.js'

/**
 * Maps JSON:API resources to ATLAS objects (Cluster, Taxonomy)
 */
export const toTaxonomyTermFromResource = (resource: AtlasJsonApiResource, type: TaxonomyType): AtlasTaxonomyTerm => {
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
  }
}

export const toTaxonomyFromTerm = (term: AtlasTaxonomyTerm): Omit<Taxonomy, 'id'> => {
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
