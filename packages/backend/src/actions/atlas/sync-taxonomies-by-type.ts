import type { TaxonomyType, ActionResult, ActionArgsWithDb } from '@/types.js'
import type { getAtlasClient } from '@/actions/atlas/atlas-client.js'
import { getTaxonomies } from '@/actions/atlas/get-taxonomies.js'
import { KNOWLEDGE_DOMAIN_HIERARCHY } from '@/actions/atlas/constants.js'

export const syncTaxonomiesByType = async ({
  logger,
  data: { type },
  dependencies: { atlasClient },
}: ActionArgsWithDb<{ type: TaxonomyType }, { atlasClient: ReturnType<typeof getAtlasClient> }>): Promise<
  ActionResult<number>
> => {
  logger.info(`Syncing taxonomy type: ${type}`)

  const result = await getTaxonomies({ data: { type }, logger, dependencies: { atlasClient } })

  if (!result.success) {
    return result
  }

  if (result.data.length === 0) {
    return {
      success: false,
      code: 'notFound',
      message: `No terms found for taxonomy type ${type}`,
    }
  }

  const rows = result.data.map((row) => {
    let parentId = row.parentId

    if (type === 'cluster_thematic_area' && row.atlasId && row.atlasId in KNOWLEDGE_DOMAIN_HIERARCHY) {
      parentId = KNOWLEDGE_DOMAIN_HIERARCHY[row.atlasId]
    }

    return {
      atlasId: row.atlasId,
      taxonomyType: type,
      name: row.name || '',
      description: row.description,
      parentId,
      metadata: row.metadata,
      lastSyncedAt: new Date(),
    }
  })

  logger.info(`Synced ${rows.length} terms for taxonomy type ${type}.`)

  return {
    success: true,
    data: rows.length,
  }
}
