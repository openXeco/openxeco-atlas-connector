import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '../config/database.js';
import { entities, entityVersions } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { atlasClient } from '../services/atlas/client.js';
import { jsonApiTransformer } from '../services/atlas/transformer.js';

const createEntitySchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  countryId: z.string().uuid().optional(),
  clusterTypeId: z.string().uuid().optional(),
  legalStatusId: z.string().uuid().optional(),
  organizationTypeId: z.string().uuid().optional(),
});

const updateEntitySchema = createEntitySchema.partial();

export async function entityRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { page = 1, limit = 10, status, syncStatus } = request.query as {
          page?: number;
          limit?: number;
          status?: string;
          syncStatus?: string;
        };

        const offset = (Number(page) - 1) * Number(limit);

        let query = db.select().from(entities);

        if (status) {
          query = query.where(eq(entities.status, status)) as any;
        }

        if (syncStatus) {
          query = query.where(eq(entities.syncStatus, syncStatus)) as any;
        }

        const results = await query
          .limit(Number(limit))
          .offset(offset)
          .orderBy(desc(entities.createdAt));

        return reply.send({
          data: results,
          meta: {
            page: Number(page),
            limit: Number(limit),
            count: results.length,
          },
        });
      } catch (error) {
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Failed to fetch entities',
        });
      }
    }
  );

  fastify.get(
    '/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const [entity] = await db
          .select()
          .from(entities)
          .where(eq(entities.id, id))
          .limit(1);

        if (!entity) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Entity not found',
          });
        }

        return reply.send({ data: entity });
      } catch (error) {
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Failed to fetch entity',
        });
      }
    }
  );

  fastify.post(
    '/',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const body = createEntitySchema.parse(request.body);

        const [entity] = await db
          .insert(entities)
          .values({
            name: body.name,
            description: body.description,
            logoUrl: body.logoUrl,
            website: body.website,
            address: body.address,
            latitude: body.latitude?.toString(),
            longitude: body.longitude?.toString(),
            countryId: body.countryId,
            clusterTypeId: body.clusterTypeId,
            legalStatusId: body.legalStatusId,
            organizationTypeId: body.organizationTypeId,
            status: 'draft',
            syncStatus: 'local',
            createdBy: request.currentUser?.userId,
            updatedBy: request.currentUser?.userId,
          })
          .returning();

        await db.insert(entityVersions).values({
          entityId: entity.id,
          version: '1.0',
          data: entity as any,
          changedBy: request.currentUser?.userId,
        });

        return reply.status(201).send({
          data: entity,
          message: 'Entity created successfully',
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: error.errors,
          });
        }
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Failed to create entity',
        });
      }
    }
  );

  fastify.patch(
    '/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = updateEntitySchema.parse(request.body);

        const [existing] = await db
          .select()
          .from(entities)
          .where(eq(entities.id, id))
          .limit(1);

        if (!existing) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Entity not found',
          });
        }

        const [updated] = await db
          .update(entities)
          .set({
            ...(body.name && { name: body.name }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
            ...(body.website !== undefined && { website: body.website }),
            ...(body.address !== undefined && { address: body.address }),
            ...(body.latitude !== undefined && { latitude: body.latitude.toString() }),
            ...(body.longitude !== undefined && { longitude: body.longitude.toString() }),
            ...(body.countryId !== undefined && { countryId: body.countryId }),
            ...(body.clusterTypeId !== undefined && { clusterTypeId: body.clusterTypeId }),
            ...(body.legalStatusId !== undefined && { legalStatusId: body.legalStatusId }),
            ...(body.organizationTypeId !== undefined && { organizationTypeId: body.organizationTypeId }),
            updatedAt: new Date(),
            updatedBy: request.currentUser?.userId,
          })
          .where(eq(entities.id, id))
          .returning();

        const versions = await db
          .select()
          .from(entityVersions)
          .where(eq(entityVersions.entityId, id))
          .orderBy(desc(entityVersions.createdAt))
          .limit(1);

        const lastVersion = versions[0];
        const newVersion = lastVersion
          ? `${parseInt(lastVersion.version.split('.')[0]) + 1}.0`
          : '1.0';

        await db.insert(entityVersions).values({
          entityId: id,
          version: newVersion,
          data: updated as any,
          changedBy: request.currentUser?.userId,
        });

        return reply.send({
          data: updated,
          message: 'Entity updated successfully',
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: error.errors,
          });
        }
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Failed to update entity',
        });
      }
    }
  );

  fastify.delete(
    '/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const [existing] = await db
          .select()
          .from(entities)
          .where(eq(entities.id, id))
          .limit(1);

        if (!existing) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Entity not found',
          });
        }

        await db.delete(entities).where(eq(entities.id, id));

        return reply.send({
          message: 'Entity deleted successfully',
        });
      } catch (error) {
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Failed to delete entity',
        });
      }
    }
  );

  fastify.post(
    '/:id/sync',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const [entity] = await db
          .select()
          .from(entities)
          .where(eq(entities.id, id))
          .limit(1);

        if (!entity) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Entity not found',
          });
        }

        const clusterInput = jsonApiTransformer.toClusterInputFromEntity(entity);

        let cluster;
        if (entity.atlasId) {
          cluster = await atlasClient.updateCluster(entity.atlasId, clusterInput);
        } else {
          cluster = await atlasClient.createCluster(clusterInput);
        }

        const [updated] = await db
          .update(entities)
          .set({
            atlasId: cluster.atlasId,
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
          })
          .where(eq(entities.id, id))
          .returning();

        return reply.send({
          data: updated,
          message: 'Entity synced to ATLAS successfully',
        });
      } catch (error) {
        const { id } = request.params as { id: string };
        
        await db
          .update(entities)
          .set({
            syncStatus: 'failed',
          })
          .where(eq(entities.id, id));

        return reply.status(500).send({
          error: 'Sync Failed',
          message: error instanceof Error ? error.message : 'Failed to sync entity to ATLAS',
        });
      }
    }
  );

  fastify.get(
    '/:id/versions',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const versions = await db
          .select()
          .from(entityVersions)
          .where(eq(entityVersions.entityId, id))
          .orderBy(desc(entityVersions.createdAt));

        return reply.send({
          data: versions,
          meta: {
            count: versions.length,
          },
        });
      } catch (error) {
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Failed to fetch entity versions',
        });
      }
    }
  );
}
