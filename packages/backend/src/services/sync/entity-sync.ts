import { eq, desc, lt } from 'drizzle-orm'
import { db } from '@/config/database.js'
import { entities, entityVersions, syncLogs } from '@/db/schema.js'
import { atlasClient } from '../atlas/client.js'
import { jsonApiTransformer } from '../atlas/transformer.js'
import type { Entity } from '@/db/schema.js'
import type { Logger } from 'pino'
import { getLogger } from '@/utils/logger.js'
import type { Cluster } from '@/services/atlas/types.js'

export interface SyncResult {
  success: boolean
  entityId: string
  atlasId?: string
  message: string
  error?: string
}

export interface ConflictReport {
  hasConflict: boolean
  localVersion: Entity
  remoteVersion: Partial<Entity> | null
  localUpdatedAt: Date
  remoteUpdatedAt: Date
  conflictFields: string[]
}

export interface EntityDiff {
  field: string
  // biome-ignore lint/suspicious/noExplicitAny: It's fine here
  localValue: any
  // biome-ignore lint/suspicious/noExplicitAny: It's fine here
  remoteValue: any
  isDifferent: boolean
}

export interface BatchSyncResult {
  total: number
  success: number
  failed: number
  results: SyncResult[]
}

export class EntitySyncService {
  private readonly logger: Logger

  constructor() {
    this.logger = getLogger()
  }
  async pushEntity(entityId: string, _userId?: string, options?: { force?: boolean }): Promise<SyncResult> {
    this.logger.info(`Pushing entity ${entityId} to ATLAS`)

    try {
      // const [entity] = await db.select().from(entities).where(eq(entities.id, entityId)).limit(1)
      const entity = await db.query.entities.findFirst({
        where: { id: entityId },
        with: {
          country: true,
          clusterType: true,
          thematicAreas: true,
          sectors: true,
          technologies: true,
          useCases: true,
          fieldsOfActivity: true,
        },
      })

      if (!entity) {
        return {
          success: false,
          entityId,
          message: "Entity doesn't exist",
          error: 'NOT FOUND',
        }
      }

      await db.update(entities).set({ syncStatus: 'pending_push' }).where(eq(entities.id, entityId))

      const clusterInput = jsonApiTransformer.toClusterInputFromEntity(
        entity,
        entity.clusterType?.atlasId || undefined,
        {
          thematicAreaIds: entity.thematicAreas.map((t) => t.atlasId) || [],
          sectorIds: entity.sectors.map((s) => s.atlasId) || [],
          technologyIds: entity.technologies.map((t) => t.atlasId) || [],
          useCaseIds: entity.useCases.map((u) => u.atlasId) || [],
          fieldsOfActivityIds: entity.fieldsOfActivity.map((f) => f.atlasId) || [],
        },
      )

      let cluster: Cluster

      if (entity.atlasId) {
        if (!options?.force) {
          const conflict = await this.detectConflicts(entityId)
          if (conflict.hasConflict) {
            await db.update(entities).set({ syncStatus: 'conflict' }).where(eq(entities.id, entityId))

            await db.insert(syncLogs).values({
              entityType: 'entity',
              entityId,
              operation: 'push',
              status: 'failed',
              details: {
                error: 'Conflict detected',
                conflictFields: conflict.conflictFields,
              },
            })

            return {
              success: false,
              entityId,
              atlasId: entity.atlasId,
              message: 'Conflict detected. Please resolve before pushing.',
              error: 'CONFLICT',
            }
          }
        }

        cluster = await atlasClient.updateCluster(entity.atlasId, clusterInput)
      } else {
        cluster = await atlasClient.createCluster(clusterInput)
      }

      await db.transaction(async (tx) => {
        await tx
          .update(entities)
          .set({
            atlasId: cluster.atlasId,
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
          })
          .where(eq(entities.id, entityId))
          .returning()

        await tx.insert(syncLogs).values({
          entityType: 'entity',
          entityId,
          operation: 'push',
          status: 'success',
          details: {
            atlasId: cluster.atlasId,
            action: entity.atlasId ? 'update' : 'create',
          },
        })
      })

      this.logger.info(`Successfully pushed entity ${entityId} to ATLAS`)

      return {
        success: true,
        entityId,
        atlasId: cluster.atlasId,
        message: entity.atlasId ? 'Entity updated in ATLAS' : 'Entity created in ATLAS',
      }
    } catch (error) {
      this.logger.error(error as Error, `Failed to push entity ${entityId}:`)

      await db.update(entities).set({ syncStatus: 'failed' }).where(eq(entities.id, entityId))

      await db.insert(syncLogs).values({
        entityType: 'entity',
        entityId,
        operation: 'push',
        status: 'failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })

      return {
        success: false,
        entityId,
        message: 'Failed to push entity to ATLAS',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async pullEntity(atlasId: string): Promise<SyncResult> {
    this.logger.info(`Pulling entity ${atlasId} from ATLAS`)

    try {
      const cluster = await atlasClient.getCluster(atlasId)
      const entityData = jsonApiTransformer.toEntityFromCluster(cluster)

      const [existing] = await db.select().from(entities).where(eq(entities.atlasId, atlasId)).limit(1)

      let entity: Entity
      if (existing) {
        const localUpdated = existing.updatedAt ? new Date(existing.updatedAt) : new Date()
        const remoteUpdated = cluster.updatedAt ? new Date(cluster.updatedAt) : new Date()

        if (localUpdated > remoteUpdated) {
          await db.update(entities).set({ syncStatus: 'conflict' }).where(eq(entities.id, existing.id))

          await db.insert(syncLogs).values({
            entityType: 'entity',
            entityId: existing.id,
            operation: 'pull',
            status: 'failed',
            details: {
              error: 'Conflict detected',
              localUpdated: localUpdated.toISOString(),
              remoteUpdated: remoteUpdated.toISOString(),
            },
          })

          return {
            success: false,
            entityId: existing.id,
            atlasId,
            message: 'Conflict detected. Local version is newer.',
            error: 'CONFLICT',
          }
        }

        ;[entity] = await db
          .update(entities)
          .set({
            ...entityData,
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(entities.id, existing.id))
          .returning()

        const versions = await db
          .select()
          .from(entityVersions)
          .where(eq(entityVersions.entityId, existing.id))
          .orderBy(desc(entityVersions.createdAt))
          .limit(1)

        const lastVersion = versions[0]
        const lastMajor = lastVersion ? Number.parseInt(lastVersion.version, 10) || 0 : 0
        const newVersion = `${lastMajor + 1}.0`

        await db.insert(entityVersions).values({
          entityId: existing.id,
          version: newVersion,
          data: entity as Entity,
        })
      } else {
        ;[entity] = await db
          .insert(entities)
          .values({
            ...entityData,
            name: entityData.name || '',
            status: entityData.status || 'draft',
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
          })
          .returning()

        await db.insert(entityVersions).values({
          entityId: entity.id,
          version: '1.0',
          data: entity as Entity,
        })
      }

      await db.insert(syncLogs).values({
        entityType: 'entity',
        entityId: entity.id,
        operation: 'pull',
        status: 'success',
        details: {
          atlasId,
          action: existing ? 'update' : 'create',
        },
      })

      this.logger.info(`Successfully pulled entity ${atlasId} from ATLAS`)

      return {
        success: true,
        entityId: entity.id,
        atlasId,
        message: existing ? 'Entity updated from ATLAS' : 'Entity created from ATLAS',
      }
    } catch (error) {
      this.logger.error(error as Error, `Failed to pull entity ${atlasId}:`)

      await db.insert(syncLogs).values({
        entityType: 'entity',
        operation: 'pull',
        status: 'failed',
        details: {
          atlasId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })

      return {
        success: false,
        entityId: '',
        atlasId,
        message: 'Failed to pull entity from ATLAS',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async detectConflicts(entityId: string): Promise<ConflictReport> {
    const [entity] = await db.select().from(entities).where(eq(entities.id, entityId)).limit(1)

    if (!entity || !entity.atlasId) {
      return {
        hasConflict: false,
        localVersion: entity,
        remoteVersion: null,
        localUpdatedAt: entity.updatedAt ? new Date(entity.updatedAt) : new Date(),
        remoteUpdatedAt: new Date(),
        conflictFields: [],
      }
    }

    try {
      const cluster = await atlasClient.getCluster(entity.atlasId)
      const remoteEntity = jsonApiTransformer.toEntityFromCluster(cluster)

      const localUpdatedAt = entity.updatedAt ? new Date(entity.updatedAt) : new Date()
      const remoteUpdatedAt = cluster.updatedAt ? new Date(cluster.updatedAt) : new Date()

      const lastSynced = entity.lastSyncedAt ? new Date(entity.lastSyncedAt) : new Date(0)

      const localModifiedAfterSync = localUpdatedAt > lastSynced
      const remoteModifiedAfterSync = remoteUpdatedAt > lastSynced

      if (!localModifiedAfterSync || !remoteModifiedAfterSync) {
        return {
          hasConflict: false,
          localVersion: entity,
          remoteVersion: remoteEntity,
          localUpdatedAt,
          remoteUpdatedAt,
          conflictFields: [],
        }
      }

      const conflictFields: string[] = []
      const fieldsToCheck = [
        'name',
        'nameNational',
        'entityDepartment',
        'description',
        'streetAddress',
        'city',
        'countryCode',
        'postalCode',
        'latitude',
        'longitude',
        'email',
        'phone',
        'website',
        'registrationNumber',
        'logoUrl',
        'isHeadquarter',
        'headquarterInfo',
        'hasSubsidiaries',
        'subsidiariesDetails',
        'hasMajorityShares',
        'majoritySharesDetails',
        'article138Compliance',
        'dataShareConsent',
        'contactFirstName',
        'contactLastName',
        'contactEmail',
        'contactPosition',
        'contactPhone',
        'expertiseDescription',
        'goalsToAchieve',
        'goalsToContribute',
        'countryId',
        'clusterTypeId',
        'moderationState',
      ]

      for (const field of fieldsToCheck) {
        if (entity[field as keyof Entity] !== remoteEntity[field as keyof Entity]) {
          conflictFields.push(field)
        }
      }

      return {
        hasConflict: conflictFields.length > 0,
        localVersion: entity,
        remoteVersion: remoteEntity,
        localUpdatedAt,
        remoteUpdatedAt,
        conflictFields,
      }
    } catch (error) {
      this.logger.error(error as Error, `Failed to detect conflicts for entity ${entityId}:`)
      throw error
    }
  }

  async getDiff(entityId: string): Promise<EntityDiff[]> {
    const [entity] = await db.select().from(entities).where(eq(entities.id, entityId)).limit(1)

    if (!entity || !entity.atlasId) {
      return []
    }

    try {
      const cluster = await atlasClient.getCluster(entity.atlasId)
      const remoteEntity = jsonApiTransformer.toEntityFromCluster(cluster)

      const diffs: EntityDiff[] = []
      const fieldsToCompare = [
        'name',
        'nameNational',
        'entityDepartment',
        'streetAddress',
        'city',
        'countryCode',
        'email',
        'phone',
        'website',
        'registrationNumber',
        'logoUrl',
        'isHeadquarter',
        'headquarterInfo',
        'hasSubsidiaries',
        'subsidiariesDetails',
        'hasMajorityShares',
        'majoritySharesDetails',
        'article138Compliance',
        'dataShareConsent',
        'contactFirstName',
        'contactLastName',
        'contactEmail',
        'contactPosition',
        'contactPhone',
        'expertiseDescription',
        'goalsToAchieve',
        'goalsToContribute',
        'countryId',
        'clusterTypeId',
        'moderationState',
      ]

      for (const field of fieldsToCompare) {
        const localValue = entity[field as keyof Entity]
        const remoteValue = remoteEntity[field as keyof Entity]
        diffs.push({
          field,
          localValue,
          remoteValue,
          isDifferent: localValue !== remoteValue,
        })
      }

      return diffs
    } catch (error) {
      this.logger.error(error as Error, `Failed to get diff for entity ${entityId}:`)
      throw error
    }
  }

  async resolveConflict(entityId: string, resolution: 'local' | 'remote', userId?: string): Promise<SyncResult> {
    this.logger.info(`Resolving conflict for entity ${entityId} with ${resolution} version`)

    try {
      if (resolution === 'local') {
        return await this.pushEntity(entityId, userId, { force: true })
      }
      const [entity] = await db.select().from(entities).where(eq(entities.id, entityId)).limit(1)

      if (!entity || !entity.atlasId) {
        throw new Error('Entity or ATLAS ID not found')
      }

      return await this.pullEntity(entity.atlasId)
    } catch (error) {
      this.logger.error(error as Error, `Failed to resolve conflict for entity ${entityId}:`)
      throw error
    }
  }

  private async processBatch<T>(
    items: T[],
    fn: (item: T) => Promise<SyncResult>,
    concurrency = 5,
  ): Promise<BatchSyncResult> {
    const results: SyncResult[] = []
    let success = 0
    let failed = 0

    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency)
      const chunkResults = await Promise.all(chunk.map(fn))
      for (const result of chunkResults) {
        results.push(result)
        if (result.success) success++
        else failed++
      }
    }

    return { total: items.length, success, failed, results }
  }

  async pushBatch(entityIds: string[], userId?: string): Promise<BatchSyncResult> {
    this.logger.info(`Pushing batch of ${entityIds.length} entities to ATLAS`)
    return this.processBatch(entityIds, (id) => this.pushEntity(id, userId))
  }

  async pullBatch(atlasIds: string[]): Promise<BatchSyncResult> {
    this.logger.info(`Pulling batch of ${atlasIds.length} entities from ATLAS`)
    return this.processBatch(atlasIds, (id) => this.pullEntity(id))
  }

  async cleanupSyncLogs(retentionDays = 90): Promise<number> {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    this.logger.info(`Cleaning up sync logs older than ${cutoff.toISOString()}`)

    const deleted = await db.delete(syncLogs).where(lt(syncLogs.createdAt, cutoff)).returning({ id: syncLogs.id })

    this.logger.info(`Deleted ${deleted.length} old sync log entries`)
    return deleted.length
  }
}

export const entitySyncService = new EntitySyncService()
