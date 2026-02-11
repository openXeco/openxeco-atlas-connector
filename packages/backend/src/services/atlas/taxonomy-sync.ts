import { eq } from 'drizzle-orm'
import { db } from '../../config/database.js'
import { taxonomies, syncLogs } from '../../db/schema.js'
import { logger } from '../../utils/logger.js'
import { atlasClient } from './client.js'
import { jsonApiTransformer } from './transformer.js'
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
  'organization_type',
  'position_category',
  'sectors',
  'technologies',
  'use_cases',
  'citations_source',
]

export class TaxonomySyncService {
  async syncAllTaxonomies(): Promise<{
    success: number
    failed: number
    total: number
  }> {
    logger.info('Starting taxonomy sync from ATLAS')

    let success = 0
    let failed = 0

    for (const type of TAXONOMY_TYPES) {
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

    let synced = 0

    for (const term of terms) {
      try {
        const taxonomyData = jsonApiTransformer.toTaxonomyFromTerm(term)

        const [existing] = await db.select().from(taxonomies).where(eq(taxonomies.atlasId, term.atlasId)).limit(1)

        if (existing) {
          await db
            .update(taxonomies)
            .set({
              name: taxonomyData.name!,
              taxonomyType: taxonomyData.taxonomyType!,
              description: taxonomyData.description,
              parentId: taxonomyData.parentId,
              metadata: taxonomyData.metadata,
              lastSyncedAt: new Date(),
            })
            .where(eq(taxonomies.id, existing.id))
        } else {
          await db.insert(taxonomies).values({
            atlasId: taxonomyData.atlasId!,
            taxonomyType: taxonomyData.taxonomyType!,
            name: taxonomyData.name!,
            description: taxonomyData.description,
            parentId: taxonomyData.parentId,
            metadata: taxonomyData.metadata,
            lastSyncedAt: taxonomyData.lastSyncedAt,
          })
        }

        synced++
      } catch (error) {
        logger.error(`Failed to sync taxonomy term: ${term.name}`, error as Error)
      }
    }

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

  async searchTaxonomies(_query: string, type?: TaxonomyType) {
    return db
      .select()
      .from(taxonomies)
      .where(type ? eq(taxonomies.taxonomyType, type) : undefined)
      .orderBy(taxonomies.name)
      .limit(50)
  }
}

export const taxonomySyncService = new TaxonomySyncService()
