import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '../config/database.js';
import {
  entities,
  entityVersions,
  entityThematicAreas,
  entitySectors,
  entityTechnologies,
  entityUseCases,
  entityFieldsOfActivity,
} from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { atlasClient } from '../services/atlas/client.js';
import { jsonApiTransformer } from '../services/atlas/transformer.js';

// Base validation schema for ATLAS-compliant entity registration
const baseEntitySchema = z.object({
  // Basic information (mandatory)
  name: z.string().min(1).max(500), // title (English) *
  nameNational: z.string().min(1).max(400).optional(), // field_institution_name_in_nation *
  entityDepartment: z.string().max(400).optional(),
  description: z.string().optional(),
  
  // Address (structured) - mandatory fields
  countryCode: z.string().length(2).optional(), // field_address.country_code *
  city: z.string().max(400).optional(), // field_address.locality *
  streetAddress: z.string().max(400).optional(), // field_address.address_line *
  postalCode: z.string().max(20).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  
  // Organization details (mandatory)
  email: z.string().email().optional(), // field_general_contact_e_mail *
  phone: z.string().max(50).optional(),
  website: z.string().url().optional(), // field_url.uri *
  registrationNumber: z.string().max(100).optional(),
  logoUrl: z.string().url().optional(),
  
  // Headquarters information
  isHeadquarter: z.boolean().optional(), // field_question_headquarter *
  headquarterInfo: z.string().optional(), // required if isHeadquarter is false
  
  // Subsidiaries and ownership
  hasSubsidiaries: z.boolean().optional(), // field_question_subsidiaries *
  subsidiariesDetails: z.string().optional(), // required if hasSubsidiaries is true
  hasMajorityShares: z.boolean().optional(), // field_question_majority *
  majoritySharesDetails: z.string().optional(), // required if hasMajorityShares is true
  
  // Compliance (mandatory)
  article138Compliance: z.boolean().optional(), // field_article_136_compliance *
  dataShareConsent: z.boolean().optional(), // field_data_sharing_consent *
  
  // Contact person / Representative (mandatory)
  contactFirstName: z.string().max(400).optional(), // field_first_name *
  contactLastName: z.string().max(400).optional(), // field_family_name *
  contactEmail: z.string().email().optional(), // field_e_mail *
  contactPosition: z.string().max(400).optional(),
  contactPhone: z.string().max(50).optional(),
  
  // Expertise (mandatory)
  expertiseDescription: z.string().max(800).optional(), // field_field_of_activity_descr * (max 800 chars)
  goalsToAchieve: z.string().max(800).optional(),
  goalsToContribute: z.string().max(800).optional(),
  
  // Taxonomy references
  countryId: z.string().uuid().optional(),
  clusterTypeId: z.string().uuid().optional(), // field_cluster_type *
  organizationTypeId: z.string().uuid().optional(),
  
  // JRC Taxonomy relationships (at least one dimension required)
  thematicAreaIds: z.array(z.string().uuid()).optional(), // Knowledge domains
  sectorIds: z.array(z.string().uuid()).optional(),
  technologyIds: z.array(z.string().uuid()).optional(),
  useCaseIds: z.array(z.string().uuid()).optional(),
  fieldsOfActivityIds: z.array(z.string().uuid()).optional(), // Article 8(3) expertise *
  
  // Workflow
  moderationState: z.enum(['draft', 'ready_for_publication', 'to_be_rejected']).optional(),
});

// Create schema with conditional validation
const createEntitySchema = baseEntitySchema.refine(
  (data) => {
    // If isHeadquarter is false, headquarterInfo is required
    if (data.isHeadquarter === false && !data.headquarterInfo) {
      return false;
    }
    return true;
  },
  {
    message: 'Headquarter information is required when organization is not the main headquarter',
    path: ['headquarterInfo'],
  }
).refine(
  (data) => {
    // If hasSubsidiaries is true, subsidiariesDetails is required
    if (data.hasSubsidiaries === true && !data.subsidiariesDetails) {
      return false;
    }
    return true;
  },
  {
    message: 'Subsidiaries details are required when organization has subsidiaries',
    path: ['subsidiariesDetails'],
  }
).refine(
  (data) => {
    // If hasMajorityShares is true, majoritySharesDetails is required
    if (data.hasMajorityShares === true && !data.majoritySharesDetails) {
      return false;
    }
    return true;
  },
  {
    message: 'Majority shares details are required when organization holds majority shares',
    path: ['majoritySharesDetails'],
  }
);

// Update schema (partial of base schema, refinements applied at validation time if needed)
const updateEntitySchema = baseEntitySchema.partial();

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
            // Basic information
            name: body.name,
            nameNational: body.nameNational,
            entityDepartment: body.entityDepartment,
            description: body.description,
            
            // Address
            countryCode: body.countryCode,
            city: body.city,
            streetAddress: body.streetAddress,
            postalCode: body.postalCode,
            latitude: body.latitude?.toString(),
            longitude: body.longitude?.toString(),
            
            // Organization details
            email: body.email,
            phone: body.phone,
            website: body.website,
            registrationNumber: body.registrationNumber,
            logoUrl: body.logoUrl,
            
            // Headquarters
            isHeadquarter: body.isHeadquarter,
            headquarterInfo: body.headquarterInfo,
            
            // Subsidiaries
            hasSubsidiaries: body.hasSubsidiaries,
            subsidiariesDetails: body.subsidiariesDetails,
            hasMajorityShares: body.hasMajorityShares,
            majoritySharesDetails: body.majoritySharesDetails,
            
            // Compliance
            article138Compliance: body.article138Compliance,
            dataShareConsent: body.dataShareConsent,
            
            // Contact person
            contactFirstName: body.contactFirstName,
            contactLastName: body.contactLastName,
            contactEmail: body.contactEmail,
            contactPosition: body.contactPosition,
            contactPhone: body.contactPhone,
            
            // Expertise
            expertiseDescription: body.expertiseDescription,
            goalsToAchieve: body.goalsToAchieve,
            goalsToContribute: body.goalsToContribute,
            
            // Taxonomy references
            countryId: body.countryId,
            clusterTypeId: body.clusterTypeId,
            organizationTypeId: body.organizationTypeId,
            
            // Workflow
            status: 'draft',
            moderationState: body.moderationState || 'draft',
            syncStatus: 'local',
            createdBy: request.currentUser?.userId,
            updatedBy: request.currentUser?.userId,
          })
          .returning();

        // Insert JRC Taxonomy relationships
        if (body.thematicAreaIds && body.thematicAreaIds.length > 0) {
          await db.insert(entityThematicAreas).values(
            body.thematicAreaIds.map((taxonomyId) => ({
              entityId: entity.id,
              taxonomyId,
            }))
          );
        }

        if (body.sectorIds && body.sectorIds.length > 0) {
          await db.insert(entitySectors).values(
            body.sectorIds.map((taxonomyId) => ({
              entityId: entity.id,
              taxonomyId,
            }))
          );
        }

        if (body.technologyIds && body.technologyIds.length > 0) {
          await db.insert(entityTechnologies).values(
            body.technologyIds.map((taxonomyId) => ({
              entityId: entity.id,
              taxonomyId,
            }))
          );
        }

        if (body.useCaseIds && body.useCaseIds.length > 0) {
          await db.insert(entityUseCases).values(
            body.useCaseIds.map((taxonomyId) => ({
              entityId: entity.id,
              taxonomyId,
            }))
          );
        }

        if (body.fieldsOfActivityIds && body.fieldsOfActivityIds.length > 0) {
          await db.insert(entityFieldsOfActivity).values(
            body.fieldsOfActivityIds.map((taxonomyId) => ({
              entityId: entity.id,
              taxonomyId,
            }))
          );
        }

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
            // Basic information
            ...(body.name && { name: body.name }),
            ...(body.nameNational !== undefined && { nameNational: body.nameNational }),
            ...(body.entityDepartment !== undefined && { entityDepartment: body.entityDepartment }),
            ...(body.description !== undefined && { description: body.description }),

            // Address
            ...(body.countryCode !== undefined && { countryCode: body.countryCode }),
            ...(body.city !== undefined && { city: body.city }),
            ...(body.streetAddress !== undefined && { streetAddress: body.streetAddress }),
            ...(body.postalCode !== undefined && { postalCode: body.postalCode }),
            ...(body.latitude !== undefined && { latitude: body.latitude.toString() }),
            ...(body.longitude !== undefined && { longitude: body.longitude.toString() }),

            // Organization details
            ...(body.email !== undefined && { email: body.email }),
            ...(body.phone !== undefined && { phone: body.phone }),
            ...(body.website !== undefined && { website: body.website }),
            ...(body.registrationNumber !== undefined && { registrationNumber: body.registrationNumber }),
            ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),

            // Headquarters
            ...(body.isHeadquarter !== undefined && { isHeadquarter: body.isHeadquarter }),
            ...(body.headquarterInfo !== undefined && { headquarterInfo: body.headquarterInfo }),

            // Subsidiaries
            ...(body.hasSubsidiaries !== undefined && { hasSubsidiaries: body.hasSubsidiaries }),
            ...(body.subsidiariesDetails !== undefined && { subsidiariesDetails: body.subsidiariesDetails }),
            ...(body.hasMajorityShares !== undefined && { hasMajorityShares: body.hasMajorityShares }),
            ...(body.majoritySharesDetails !== undefined && { majoritySharesDetails: body.majoritySharesDetails }),

            // Compliance
            ...(body.article138Compliance !== undefined && { article138Compliance: body.article138Compliance }),
            ...(body.dataShareConsent !== undefined && { dataShareConsent: body.dataShareConsent }),

            // Contact person
            ...(body.contactFirstName !== undefined && { contactFirstName: body.contactFirstName }),
            ...(body.contactLastName !== undefined && { contactLastName: body.contactLastName }),
            ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
            ...(body.contactPosition !== undefined && { contactPosition: body.contactPosition }),
            ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),

            // Expertise
            ...(body.expertiseDescription !== undefined && { expertiseDescription: body.expertiseDescription }),
            ...(body.goalsToAchieve !== undefined && { goalsToAchieve: body.goalsToAchieve }),
            ...(body.goalsToContribute !== undefined && { goalsToContribute: body.goalsToContribute }),

            // Taxonomy references
            ...(body.countryId !== undefined && { countryId: body.countryId }),
            ...(body.clusterTypeId !== undefined && { clusterTypeId: body.clusterTypeId }),
            ...(body.organizationTypeId !== undefined && { organizationTypeId: body.organizationTypeId }),

            // Workflow
            ...(body.moderationState !== undefined && { moderationState: body.moderationState }),

            updatedAt: new Date(),
            updatedBy: request.currentUser?.userId,
          })
          .where(eq(entities.id, id))
          .returning();

        if (body.thematicAreaIds) {
          await db.delete(entityThematicAreas).where(eq(entityThematicAreas.entityId, id));
          if (body.thematicAreaIds.length > 0) {
            await db.insert(entityThematicAreas).values(
              body.thematicAreaIds.map((taxonomyId) => ({
                entityId: id,
                taxonomyId,
              }))
            );
          }
        }

        if (body.sectorIds) {
          await db.delete(entitySectors).where(eq(entitySectors.entityId, id));
          if (body.sectorIds.length > 0) {
            await db.insert(entitySectors).values(
              body.sectorIds.map((taxonomyId) => ({
                entityId: id,
                taxonomyId,
              }))
            );
          }
        }

        if (body.technologyIds) {
          await db.delete(entityTechnologies).where(eq(entityTechnologies.entityId, id));
          if (body.technologyIds.length > 0) {
            await db.insert(entityTechnologies).values(
              body.technologyIds.map((taxonomyId) => ({
                entityId: id,
                taxonomyId,
              }))
            );
          }
        }

        if (body.useCaseIds) {
          await db.delete(entityUseCases).where(eq(entityUseCases.entityId, id));
          if (body.useCaseIds.length > 0) {
            await db.insert(entityUseCases).values(
              body.useCaseIds.map((taxonomyId) => ({
                entityId: id,
                taxonomyId,
              }))
            );
          }
        }

        if (body.fieldsOfActivityIds) {
          await db.delete(entityFieldsOfActivity).where(eq(entityFieldsOfActivity.entityId, id));
          if (body.fieldsOfActivityIds.length > 0) {
            await db.insert(entityFieldsOfActivity).values(
              body.fieldsOfActivityIds.map((taxonomyId) => ({
                entityId: id,
                taxonomyId,
              }))
            );
          }
        }

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
