import type { TaxonomyType, ActionResult, ActionArgsWithDb } from '@/types.js'
import { getTaxonomies } from '@/actions/atlas/get-taxonomies.js'
import { KNOWLEDGE_DOMAIN_HIERARCHY } from '@/actions/atlas/constants.js'
import { toTaxonomyFromTerm } from '@/actions/atlas/utils/transformers.js'
import type { AtlasActionDependencies } from '@/actions/atlas/types.js'
import { createTaxonomySyncLog } from '@/actions/atlas/internal/create-sync-log.js'
import { taxonomies } from '@/db/schema.js'
import { sql } from 'drizzle-orm'

export const syncTaxonomiesByType = async ({
  logger,
  db,
  data: { type },
  dependencies: { atlasClient },
}: ActionArgsWithDb<{ type: TaxonomyType }, AtlasActionDependencies>): Promise<ActionResult<number>> => {
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

    // Here we override eventual parentId already preset in ATLAS (risky but it's to avoid breaking issues)
    if (type === 'cluster_thematic_area' && row.atlasId && row.atlasId in KNOWLEDGE_DOMAIN_HIERARCHY) {
      parentId = KNOWLEDGE_DOMAIN_HIERARCHY[row.atlasId]
    }

    return toTaxonomyFromTerm({ ...row, parentId })
  })

  await db
    .insert(taxonomies)
    .values(rows)
    .onConflictDoUpdate({
      target: taxonomies.atlasId,
      set: {
        name: sql`excluded.name`,
        taxonomyType: sql`excluded.taxonomy_type`,
        description: sql`excluded.description`,
        parentId: sql`excluded.parent_id`,
        metadata: sql`excluded.metadata`,
        lastSyncedAt: sql`excluded.last_synced_at`,
      },
    })

  await createTaxonomySyncLog('sync', 'synced', type, rows.length, db)
  logger.info(`Synced ${rows.length} terms for taxonomy type ${type}.`)

  return {
    success: true,
    data: rows.length,
  }
}
