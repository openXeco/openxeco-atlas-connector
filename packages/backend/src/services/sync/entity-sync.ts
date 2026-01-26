import { eq, desc } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { entities, entityVersions, syncLogs } from '../../db/schema.js';
import { logger } from '../../utils/logger.js';
import { atlasClient } from '../atlas/client.js';
import { jsonApiTransformer } from '../atlas/transformer.js';
import type { Entity } from '../../db/schema.js';

export interface SyncResult {
  success: boolean;
  entityId: string;
  atlasId?: string;
  message: string;
  error?: string;
}

export interface ConflictReport {
  hasConflict: boolean;
  localVersion: Entity;
  remoteVersion: any;
  localUpdatedAt: Date;
  remoteUpdatedAt: Date;
  conflictFields: string[];
}

export interface EntityDiff {
  field: string;
  localValue: any;
  remoteValue: any;
  isDifferent: boolean;
}

export interface BatchSyncResult {
  total: number;
  success: number;
  failed: number;
  results: SyncResult[];
}

export class EntitySyncService {
  async pushEntity(entityId: string, _userId?: string): Promise<SyncResult> {
    logger.info(`Pushing entity ${entityId} to ATLAS`);

    try {
      const [entity] = await db
        .select()
        .from(entities)
        .where(eq(entities.id, entityId))
        .limit(1);

      if (!entity) {
        throw new Error('Entity not found');
      }

      await db
        .update(entities)
        .set({ syncStatus: 'pending_push' })
        .where(eq(entities.id, entityId));

      const clusterInput = jsonApiTransformer.toClusterInputFromEntity(entity);

      let cluster;
      if (entity.atlasId) {
        const conflict = await this.detectConflicts(entityId);
        if (conflict.hasConflict) {
          await db
            .update(entities)
            .set({ syncStatus: 'conflict' })
            .where(eq(entities.id, entityId));

          await db.insert(syncLogs).values({
            entityType: 'entity',
            entityId,
            operation: 'push',
            status: 'failed',
            details: {
              error: 'Conflict detected',
              conflictFields: conflict.conflictFields,
            },
          });

          return {
            success: false,
            entityId,
            atlasId: entity.atlasId,
            message: 'Conflict detected. Please resolve before pushing.',
            error: 'CONFLICT',
          };
        }

        cluster = await atlasClient.updateCluster(entity.atlasId, clusterInput);
      } else {
        cluster = await atlasClient.createCluster(clusterInput);
      }

      await db
        .update(entities)
        .set({
          atlasId: cluster.atlasId,
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
        })
        .where(eq(entities.id, entityId))
        .returning();

      await db.insert(syncLogs).values({
        entityType: 'entity',
        entityId,
        operation: 'push',
        status: 'success',
        details: {
          atlasId: cluster.atlasId,
          action: entity.atlasId ? 'update' : 'create',
        },
      });

      logger.info(`Successfully pushed entity ${entityId} to ATLAS`);

      return {
        success: true,
        entityId,
        atlasId: cluster.atlasId,
        message: entity.atlasId
          ? 'Entity updated in ATLAS'
          : 'Entity created in ATLAS',
      };
    } catch (error) {
      logger.error(`Failed to push entity ${entityId}:`, error as Error);

      await db
        .update(entities)
        .set({ syncStatus: 'failed' })
        .where(eq(entities.id, entityId));

      await db.insert(syncLogs).values({
        entityType: 'entity',
        entityId,
        operation: 'push',
        status: 'failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return {
        success: false,
        entityId,
        message: 'Failed to push entity to ATLAS',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async pullEntity(atlasId: string, userId?: string): Promise<SyncResult> {
    logger.info(`Pulling entity ${atlasId} from ATLAS`);

    try {
      const cluster = await atlasClient.getCluster(atlasId);
      const entityData = jsonApiTransformer.toEntityFromCluster(cluster);

      const [existing] = await db
        .select()
        .from(entities)
        .where(eq(entities.atlasId, atlasId))
        .limit(1);

      let entity;
      if (existing) {
        const localUpdated = existing.updatedAt ? new Date(existing.updatedAt) : new Date();
        const remoteUpdated = new Date();

        if (localUpdated > remoteUpdated) {
          await db
            .update(entities)
            .set({ syncStatus: 'conflict' })
            .where(eq(entities.id, existing.id));

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
          });

          return {
            success: false,
            entityId: existing.id,
            atlasId,
            message: 'Conflict detected. Local version is newer.',
            error: 'CONFLICT',
          };
        }

        [entity] = await db
          .update(entities)
          .set({
            ...entityData,
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
            updatedBy: userId,
          })
          .where(eq(entities.id, existing.id))
          .returning();

        const versions = await db
          .select()
          .from(entityVersions)
          .where(eq(entityVersions.entityId, existing.id))
          .orderBy(desc(entityVersions.createdAt))
          .limit(1);

        const lastVersion = versions[0];
        const newVersion = lastVersion
          ? `${parseInt(lastVersion.version.split('.')[0]) + 1}.0`
          : '1.0';

        await db.insert(entityVersions).values({
          entityId: existing.id,
          version: newVersion,
          data: entity as any,
          changedBy: userId,
        });
      } else {
        [entity] = await db
          .insert(entities)
          .values({
            name: entityData.name || '',
            atlasId: entityData.atlasId,
            description: entityData.description,
            logoUrl: entityData.logoUrl,
            website: entityData.website,
            address: entityData.address,
            latitude: entityData.latitude,
            longitude: entityData.longitude,
            countryId: entityData.countryId,
            clusterTypeId: entityData.clusterTypeId,
            legalStatusId: entityData.legalStatusId,
            organizationTypeId: entityData.organizationTypeId,
            status: 'draft',
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
            createdBy: userId,
            updatedBy: userId,
          })
          .returning();

        await db.insert(entityVersions).values({
          entityId: entity.id,
          version: '1.0',
          data: entity as any,
          changedBy: userId,
        });
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
      });

      logger.info(`Successfully pulled entity ${atlasId} from ATLAS`);

      return {
        success: true,
        entityId: entity.id,
        atlasId,
        message: existing
          ? 'Entity updated from ATLAS'
          : 'Entity created from ATLAS',
      };
    } catch (error) {
      logger.error(`Failed to pull entity ${atlasId}:`, error as Error);

      await db.insert(syncLogs).values({
        entityType: 'entity',
        operation: 'pull',
        status: 'failed',
        details: {
          atlasId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return {
        success: false,
        entityId: '',
        atlasId,
        message: 'Failed to pull entity from ATLAS',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async detectConflicts(entityId: string): Promise<ConflictReport> {
    const [entity] = await db
      .select()
      .from(entities)
      .where(eq(entities.id, entityId))
      .limit(1);

    if (!entity || !entity.atlasId) {
      return {
        hasConflict: false,
        localVersion: entity,
        remoteVersion: null,
        localUpdatedAt: entity.updatedAt ? new Date(entity.updatedAt) : new Date(),
        remoteUpdatedAt: new Date(),
        conflictFields: [],
      };
    }

    try {
      const cluster = await atlasClient.getCluster(entity.atlasId);
      const remoteEntity = jsonApiTransformer.toEntityFromCluster(cluster);

      const localUpdatedAt = entity.updatedAt ? new Date(entity.updatedAt) : new Date();
      const remoteUpdatedAt = new Date();

      const lastSynced = entity.lastSyncedAt
        ? new Date(entity.lastSyncedAt)
        : new Date(0);

      const localModifiedAfterSync = localUpdatedAt > lastSynced;
      const remoteModifiedAfterSync = remoteUpdatedAt > lastSynced;

      if (!localModifiedAfterSync || !remoteModifiedAfterSync) {
        return {
          hasConflict: false,
          localVersion: entity,
          remoteVersion: remoteEntity,
          localUpdatedAt,
          remoteUpdatedAt,
          conflictFields: [],
        };
      }

      const conflictFields: string[] = [];
      const fieldsToCheck = [
        'name',
        'description',
        'website',
        'address',
        'latitude',
        'longitude',
        'countryId',
        'clusterTypeId',
        'legalStatusId',
        'organizationTypeId',
      ];

      for (const field of fieldsToCheck) {
        if (entity[field as keyof Entity] !== remoteEntity[field as keyof Entity]) {
          conflictFields.push(field);
        }
      }

      return {
        hasConflict: conflictFields.length > 0,
        localVersion: entity,
        remoteVersion: remoteEntity,
        localUpdatedAt,
        remoteUpdatedAt,
        conflictFields,
      };
    } catch (error) {
      logger.error(`Failed to detect conflicts for entity ${entityId}:`, error as Error);
      throw error;
    }
  }

  async getDiff(entityId: string): Promise<EntityDiff[]> {
    const [entity] = await db
      .select()
      .from(entities)
      .where(eq(entities.id, entityId))
      .limit(1);

    if (!entity || !entity.atlasId) {
      return [];
    }

    try {
      const cluster = await atlasClient.getCluster(entity.atlasId);
      const remoteEntity = jsonApiTransformer.toEntityFromCluster(cluster);

      const diffs: EntityDiff[] = [];
      const fieldsToCompare = [
        'name',
        'description',
        'website',
        'logoUrl',
        'address',
        'latitude',
        'longitude',
        'countryId',
        'clusterTypeId',
        'legalStatusId',
        'organizationTypeId',
      ];

      for (const field of fieldsToCompare) {
        const localValue = entity[field as keyof Entity];
        const remoteValue = remoteEntity[field as keyof Entity];
        diffs.push({
          field,
          localValue,
          remoteValue,
          isDifferent: localValue !== remoteValue,
        });
      }

      return diffs;
    } catch (error) {
      logger.error(`Failed to get diff for entity ${entityId}:`, error as Error);
      throw error;
    }
  }

  async resolveConflict(
    entityId: string,
    resolution: 'local' | 'remote',
    userId?: string
  ): Promise<SyncResult> {
    logger.info(`Resolving conflict for entity ${entityId} with ${resolution} version`);

    try {
      if (resolution === 'local') {
        return await this.pushEntity(entityId, userId);
      } else {
        const [entity] = await db
          .select()
          .from(entities)
          .where(eq(entities.id, entityId))
          .limit(1);

        if (!entity || !entity.atlasId) {
          throw new Error('Entity or ATLAS ID not found');
        }

        return await this.pullEntity(entity.atlasId, userId);
      }
    } catch (error) {
      logger.error(`Failed to resolve conflict for entity ${entityId}:`, error as Error);
      throw error;
    }
  }

  async pushBatch(entityIds: string[], userId?: string): Promise<BatchSyncResult> {
    logger.info(`Pushing batch of ${entityIds.length} entities to ATLAS`);

    const results: SyncResult[] = [];
    let success = 0;
    let failed = 0;

    for (const entityId of entityIds) {
      const result = await this.pushEntity(entityId, userId);
      results.push(result);
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }

    return {
      total: entityIds.length,
      success,
      failed,
      results,
    };
  }

  async pullBatch(atlasIds: string[], userId?: string): Promise<BatchSyncResult> {
    logger.info(`Pulling batch of ${atlasIds.length} entities from ATLAS`);

    const results: SyncResult[] = [];
    let success = 0;
    let failed = 0;

    for (const atlasId of atlasIds) {
      const result = await this.pullEntity(atlasId, userId);
      results.push(result);
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }

    return {
      total: atlasIds.length,
      success,
      failed,
      results,
    };
  }
}

export const entitySyncService = new EntitySyncService();
