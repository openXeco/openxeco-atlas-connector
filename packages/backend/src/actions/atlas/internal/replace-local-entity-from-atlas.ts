import { eq, inArray } from 'drizzle-orm'

import type { AtlasCluster } from '@/actions/atlas/types.js'
import { toEntityFromCluster } from '@/actions/atlas/utils/transformers.js'
import { saveTaxonomy } from '@/actions/entities/common.js'
import {
  entities,
  entityFieldsOfActivity,
  entitySectors,
  entityTechnologies,
  entityThematicAreas,
  entityUseCases,
  taxonomies,
} from '@/db/schema.js'
import type { DB } from '@/types.js'

export const replaceLocalEntityFromAtlas = async (entityId: string, remote: AtlasCluster, db: DB): Promise<void> => {
  const transformed = toEntityFromCluster(remote)
  const {
    id: _remoteLocalId,
    createdAt: _remoteCreatedAt,
    updatedAt: _remoteUpdatedAt,
    countryId: countryAtlasId,
    clusterTypeId: clusterTypeAtlasId,
    thematicAreaIds,
    sectorIds,
    technologyIds,
    useCaseIds,
    fieldsOfActivityIds,
    dataProtectionConsent: _remoteDataProtectionConsent,
    formCompletionConfirmed: _remoteFormCompletionConfirmed,
    ...entityData
  } = transformed

  await db.transaction(async (tx) => {
    const atlasTaxonomyIds = Array.from(
      new Set(
        [
          countryAtlasId,
          clusterTypeAtlasId,
          ...(thematicAreaIds ?? []),
          ...(sectorIds ?? []),
          ...(technologyIds ?? []),
          ...(useCaseIds ?? []),
          ...(fieldsOfActivityIds ?? []),
        ].filter((atlasId): atlasId is string => Boolean(atlasId)),
      ),
    )

    const taxonomyRows = atlasTaxonomyIds.length
      ? await tx
          .select({ id: taxonomies.id, atlasId: taxonomies.atlasId })
          .from(taxonomies)
          .where(inArray(taxonomies.atlasId, atlasTaxonomyIds))
      : []
    const localIdByAtlasId = new Map(taxonomyRows.map((taxonomy) => [taxonomy.atlasId, taxonomy.id]))
    const localTaxonomyId = (atlasId: string): string => {
      const localId = localIdByAtlasId.get(atlasId)

      if (!localId) {
        throw new Error(`ATLAS taxonomy ${atlasId} is not available locally.`)
      }

      return localId
    }
    const localTaxonomyIds = (atlasIds?: string[]): string[] => (atlasIds ?? []).map(localTaxonomyId)

    await tx
      .update(entities)
      .set({
        ...entityData,
        countryId: countryAtlasId ? localTaxonomyId(countryAtlasId) : null,
        clusterTypeId: clusterTypeAtlasId ? localTaxonomyId(clusterTypeAtlasId) : null,
        syncStatus: 'synced',
        syncCode: null,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(entities.id, entityId))

    await Promise.all([
      tx.delete(entityThematicAreas).where(eq(entityThematicAreas.entityId, entityId)),
      tx.delete(entitySectors).where(eq(entitySectors.entityId, entityId)),
      tx.delete(entityTechnologies).where(eq(entityTechnologies.entityId, entityId)),
      tx.delete(entityUseCases).where(eq(entityUseCases.entityId, entityId)),
      tx.delete(entityFieldsOfActivity).where(eq(entityFieldsOfActivity.entityId, entityId)),
    ])

    await Promise.all([
      saveTaxonomy(entityId, localTaxonomyIds(thematicAreaIds), tx, entityThematicAreas),
      saveTaxonomy(entityId, localTaxonomyIds(sectorIds), tx, entitySectors),
      saveTaxonomy(entityId, localTaxonomyIds(technologyIds), tx, entityTechnologies),
      saveTaxonomy(entityId, localTaxonomyIds(useCaseIds), tx, entityUseCases),
      saveTaxonomy(entityId, localTaxonomyIds(fieldsOfActivityIds), tx, entityFieldsOfActivity),
    ])
  })
}
