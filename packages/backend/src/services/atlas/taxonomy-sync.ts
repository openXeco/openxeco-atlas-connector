import { eq, and, ilike, sql } from 'drizzle-orm'
import { db } from '../../config/database.js'
import { taxonomies, syncLogs } from '../../db/schema.js'
import { logger } from '../../utils/logger.js'
import { atlasClient } from './client.js'
import { jsonApiTransformer } from './transformer.js'
import { KNOWLEDGE_DOMAIN_HIERARCHY } from './knowledge-domain-hierarchy.js'
import type { TaxonomyType } from './types.js'

const TAXONOMY_TYPES: TaxonomyType[] = [
  'activities_of_interest',
  'applications_and_technologies',
  'cluster_thematic_area',
  'cluster_type',
  'country',
  'cybersecurity_research_projects',
  'european_cybersecurity_competenc',
  'fields_of_activity',
  'funding_sources',
  'initiatives',
  'institution',
  'languages',
  'legal_status',
  'nationality',
  'position_category',
  'sectors',
  'technologies',
  'use_cases',
  'citations_source',
]

// cluster_thematic_area terms are flat on ATLAS (no parent relationships returned by the API).
// The parent/child hierarchy is hardcoded in knowledge-domain-hierarchy.ts and applied during sync.

export class TaxonomySyncService {
  private static readonly TYPE_DELAY_MS = 2000

  async syncAllTaxonomies(): Promise<{
    success: number
    failed: number
    total: number
  }> {
    logger.info('Starting taxonomy sync from ATLAS')

    let success = 0
    let failed = 0

    for (let i = 0; i < TAXONOMY_TYPES.length; i++) {
      const type = TAXONOMY_TYPES[i]
      try {
        await this.syncTaxonomyType(type)
        success++
        logger.info(`✓ Synced taxonomy type: ${type}`)
      } catch (error) {
        failed++
        logger.error(`✗ Failed to sync taxonomy type: ${type}`, error as Error)

        await db.insert(syncLogs).values({
          entityType: 'taxonomy',
          operation: 'sync',
          status: 'failed',
          details: {
            taxonomyType: type,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      }

      // Delay between taxonomy types to avoid ATLAS API rate limiting
      if (i < TAXONOMY_TYPES.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, TaxonomySyncService.TYPE_DELAY_MS))
      }
    }

    logger.info(`Taxonomy sync complete: ${success} success, ${failed} failed`)

    return {
      success,
      failed,
      total: TAXONOMY_TYPES.length,
    }
  }

  async syncTaxonomyType(type: TaxonomyType): Promise<number> {
    logger.info(`Syncing taxonomy type: ${type}`)

    const terms = await atlasClient.getTaxonomies(type)

    if (terms.length === 0) {
      logger.warn(`No terms found for taxonomy type: ${type}`)
      return 0
    }

    const rows = terms.map((term) => {
      const data = jsonApiTransformer.toTaxonomyFromTerm(term)
      // Apply hardcoded parent hierarchy for knowledge domains
      let parentId = data.parentId
      if (type === 'cluster_thematic_area' && data.atlasId && data.atlasId in KNOWLEDGE_DOMAIN_HIERARCHY) {
        parentId = KNOWLEDGE_DOMAIN_HIERARCHY[data.atlasId]
      }
      return {
        atlasId: data.atlasId!,
        taxonomyType: data.taxonomyType!,
        name: data.name!,
        description: data.description,
        parentId,
        metadata: data.metadata,
        lastSyncedAt: new Date(),
      }
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

    const synced = rows.length

    await db.insert(syncLogs).values({
      entityType: 'taxonomy',
      operation: 'sync',
      status: 'success',
      details: {
        taxonomyType: type,
        count: synced,
      },
    })

    logger.info(`Synced ${synced} terms for taxonomy type: ${type}`)

    return synced
  }

  async getTaxonomiesByType(type: TaxonomyType) {
    return db.select().from(taxonomies).where(eq(taxonomies.taxonomyType, type)).orderBy(taxonomies.name)
  }

  async getTaxonomyById(id: string) {
    const [taxonomy] = await db.select().from(taxonomies).where(eq(taxonomies.id, id)).limit(1)

    return taxonomy
  }

  async getTaxonomyByAtlasId(atlasId: string) {
    const [taxonomy] = await db.select().from(taxonomies).where(eq(taxonomies.atlasId, atlasId)).limit(1)

    return taxonomy
  }

  async searchTaxonomies(query: string, type?: TaxonomyType) {
    const conditions = []
    if (query) {
      conditions.push(ilike(taxonomies.name, `%${query}%`))
    }
    if (type) {
      conditions.push(eq(taxonomies.taxonomyType, type))
    }

    return db
      .select()
      .from(taxonomies)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(taxonomies.name)
      .limit(50)
  }
}

export const taxonomySyncService = new TaxonomySyncService()
