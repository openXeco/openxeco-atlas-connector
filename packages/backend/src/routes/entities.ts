import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq, desc, and, count as countFn } from 'drizzle-orm'
import { db } from '@/config/database.js'
import {
  entities,
  entityVersions,
  entityThematicAreas,
  entitySectors,
  entityTechnologies,
  entityUseCases,
  entityFieldsOfActivity,
} from '../db/schema.js'
import { authenticate } from '../middleware/auth.js'

import { entitySyncService } from '@/services/sync/entity-sync.js'
import { sendErrorReply, handleRouteError } from '@/utils/reply-helpers.js'

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

  // Organisation details (mandatory)
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

  // Consent fields (ECCC form Step 4)
  dataProtectionConsent: z.boolean().optional(), // GDPR disclaimer acceptance
  formCompletionConfirmed: z.boolean().optional(), // Final submission confirmation

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
})

// Create schema with conditional validation
const createEntitySchema = baseEntitySchema
  .refine(
    (data) => {
      return !(data.isHeadquarter === false && !data.headquarterInfo)
    },
    {
      message: 'Headquarter information is required when organization is not the main headquarter',
      path: ['headquarterInfo'],
    },
  )
  .refine(
    (data) => {
      return !(data.hasSubsidiaries === true && !data.subsidiariesDetails)
    },
    {
      message: 'Subsidiaries details are required when organization has subsidiaries',
      path: ['subsidiariesDetails'],
    },
  )
  .refine(
    (data) => {
      return !(data.hasMajorityShares === true && !data.majoritySharesDetails)
    },
    {
      message: 'Majority shares details are required when organization holds majority shares',
      path: ['majoritySharesDetails'],
    },
  )
  .refine(
    (data) => {
      return !(data.moderationState === 'ready_for_publication' && !data.dataProtectionConsent)
    },
    {
      message: 'Data protection consent is required for publication',
      path: ['dataProtectionConsent'],
    },
  )
  .refine(
    (data) => {
      return !(data.moderationState === 'ready_for_publication' && !data.formCompletionConfirmed)
    },
    {
      message: 'Form completion confirmation is required for publication',
      path: ['formCompletionConfirmed'],
    },
  )

// Update schema (partial of base schema, refinements applied at validation time if needed)
const updateEntitySchema = baseEntitySchema.partial()

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['draft', 'ready_for_publication', 'published', 'to_be_rejected', 'rejected']).optional(),
  syncStatus: z.enum(['local', 'pending_push', 'synced', 'conflict', 'failed']).optional(),
})

export async function entityRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { page, limit, status, syncStatus } = listQuerySchema.parse(request.query)

      const offset = (page - 1) * limit

      const conditions = []

      if (status) {
        conditions.push(eq(entities.status, status))
      }

      if (syncStatus) {
        conditions.push(eq(entities.syncStatus, syncStatus))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const [results, [{ total }]] = await Promise.all([
        db.select().from(entities).where(whereClause).limit(limit).offset(offset).orderBy(desc(entities.createdAt)),
        db.select({ total: countFn() }).from(entities).where(whereClause),
      ])

      return reply.send({
        data: results,
        meta: {
          page,
          limit,
          count: results.length,
          total,
        },
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params)

      const entity = await db.query.entities.findFirst({
        where: { id },
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
        return sendErrorReply({ reply, type: 'notFound' })
      }

      return reply.send({ data: entity })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const body = createEntitySchema.parse(request.body)

      const entity = await db.transaction(async (tx) => {
        const [entity] = await tx
          .insert(entities)
          .values({
            // Basic information
            name: body.name,
            nameNational: body.nameNational,
            entityDepartment: body.entityDepartment,

            // Address
            countryCode: body.countryCode,
            city: body.city,
            streetAddress: body.streetAddress,

            // Organisation details
            email: body.email,
            phone: body.phone,
            website: body.website,
            registrationNumber: body.registrationNumber,

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

            // Consent fields
            dataProtectionConsent: body.dataProtectionConsent,
            formCompletionConfirmed: body.formCompletionConfirmed,

            // Taxonomy references
            countryId: body.countryId,
            clusterTypeId: body.clusterTypeId,
            organizationTypeId: body.organizationTypeId,

            // Workflow
            status: 'draft',
            moderationState: body.moderationState || 'draft',
            syncStatus: 'local',
          })
          .returning()

        // Insert JRC Taxonomy relationships
        if (body.thematicAreaIds && body.thematicAreaIds.length > 0) {
          await tx.insert(entityThematicAreas).values(
            body.thematicAreaIds.map((taxonomyId) => ({
              entityId: entity.id,
              taxonomyId,
            })),
          )
        }

        if (body.sectorIds && body.sectorIds.length > 0) {
          await tx.insert(entitySectors).values(
            body.sectorIds.map((taxonomyId) => ({
              entityId: entity.id,
              taxonomyId,
            })),
          )
        }

        if (body.technologyIds && body.technologyIds.length > 0) {
          await tx.insert(entityTechnologies).values(
            body.technologyIds.map((taxonomyId) => ({
              entityId: entity.id,
              taxonomyId,
            })),
          )
        }

        if (body.useCaseIds && body.useCaseIds.length > 0) {
          await tx.insert(entityUseCases).values(
            body.useCaseIds.map((taxonomyId) => ({
              entityId: entity.id,
              taxonomyId,
            })),
          )
        }

        if (body.fieldsOfActivityIds && body.fieldsOfActivityIds.length > 0) {
          await tx.insert(entityFieldsOfActivity).values(
            body.fieldsOfActivityIds.map((taxonomyId) => ({
              entityId: entity.id,
              taxonomyId,
            })),
          )
        }

        await tx.insert(entityVersions).values({
          entityId: entity.id,
          version: '1.0',
          data: {
            ...entity,
            thematicAreaIds: body.thematicAreaIds || [],
            sectorIds: body.sectorIds || [],
            technologyIds: body.technologyIds || [],
            useCaseIds: body.useCaseIds || [],
            fieldsOfActivityIds: body.fieldsOfActivityIds || [],
          },
        })

        return entity
      })

      return reply.status(201).send({
        data: entity,
        message: 'Entity created successfully',
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.patch('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
      const body = updateEntitySchema.parse(request.body)

      const [existing] = await db.select().from(entities).where(eq(entities.id, id)).limit(1)

      if (!existing) {
        return sendErrorReply({ reply, type: 'notFound' })
      }

      const updated = await db.transaction(async (tx) => {
        const [updated] = await tx
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

            // Organisation details
            ...(body.email !== undefined && { email: body.email }),
            ...(body.phone !== undefined && { phone: body.phone }),
            ...(body.website !== undefined && { website: body.website }),
            ...(body.registrationNumber !== undefined && {
              registrationNumber: body.registrationNumber,
            }),
            ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),

            // Headquarters
            ...(body.isHeadquarter !== undefined && { isHeadquarter: body.isHeadquarter }),
            ...(body.headquarterInfo !== undefined && { headquarterInfo: body.headquarterInfo }),

            // Subsidiaries
            ...(body.hasSubsidiaries !== undefined && { hasSubsidiaries: body.hasSubsidiaries }),
            ...(body.subsidiariesDetails !== undefined && {
              subsidiariesDetails: body.subsidiariesDetails,
            }),
            ...(body.hasMajorityShares !== undefined && {
              hasMajorityShares: body.hasMajorityShares,
            }),
            ...(body.majoritySharesDetails !== undefined && {
              majoritySharesDetails: body.majoritySharesDetails,
            }),

            // Compliance
            ...(body.article138Compliance !== undefined && {
              article138Compliance: body.article138Compliance,
            }),
            ...(body.dataShareConsent !== undefined && { dataShareConsent: body.dataShareConsent }),

            // Contact person
            ...(body.contactFirstName !== undefined && { contactFirstName: body.contactFirstName }),
            ...(body.contactLastName !== undefined && { contactLastName: body.contactLastName }),
            ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
            ...(body.contactPosition !== undefined && { contactPosition: body.contactPosition }),
            ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),

            // Expertise
            ...(body.expertiseDescription !== undefined && {
              expertiseDescription: body.expertiseDescription,
            }),
            ...(body.goalsToAchieve !== undefined && { goalsToAchieve: body.goalsToAchieve }),
            ...(body.goalsToContribute !== undefined && {
              goalsToContribute: body.goalsToContribute,
            }),

            // Consent fields
            ...(body.dataProtectionConsent !== undefined && {
              dataProtectionConsent: body.dataProtectionConsent,
            }),
            ...(body.formCompletionConfirmed !== undefined && {
              formCompletionConfirmed: body.formCompletionConfirmed,
            }),

            // Taxonomy references
            ...(body.countryId !== undefined && { countryId: body.countryId }),
            ...(body.clusterTypeId !== undefined && { clusterTypeId: body.clusterTypeId }),
            ...(body.organizationTypeId !== undefined && {
              organizationTypeId: body.organizationTypeId,
            }),

            // Workflow
            ...(body.moderationState !== undefined && { moderationState: body.moderationState }),

            updatedAt: new Date(),
          })
          .where(eq(entities.id, id))
          .returning()

        if (body.thematicAreaIds !== undefined) {
          await tx.delete(entityThematicAreas).where(eq(entityThematicAreas.entityId, id))
          if (body.thematicAreaIds.length > 0) {
            await tx.insert(entityThematicAreas).values(
              body.thematicAreaIds.map((taxonomyId) => ({
                entityId: id,
                taxonomyId,
              })),
            )
          }
        }

        if (body.sectorIds !== undefined) {
          await tx.delete(entitySectors).where(eq(entitySectors.entityId, id))
          if (body.sectorIds.length > 0) {
            await tx.insert(entitySectors).values(
              body.sectorIds.map((taxonomyId) => ({
                entityId: id,
                taxonomyId,
              })),
            )
          }
        }

        if (body.technologyIds !== undefined) {
          await tx.delete(entityTechnologies).where(eq(entityTechnologies.entityId, id))
          if (body.technologyIds.length > 0) {
            await tx.insert(entityTechnologies).values(
              body.technologyIds.map((taxonomyId) => ({
                entityId: id,
                taxonomyId,
              })),
            )
          }
        }

        if (body.useCaseIds !== undefined) {
          await tx.delete(entityUseCases).where(eq(entityUseCases.entityId, id))
          if (body.useCaseIds.length > 0) {
            await tx.insert(entityUseCases).values(
              body.useCaseIds.map((taxonomyId) => ({
                entityId: id,
                taxonomyId,
              })),
            )
          }
        }

        if (body.fieldsOfActivityIds !== undefined) {
          await tx.delete(entityFieldsOfActivity).where(eq(entityFieldsOfActivity.entityId, id))
          if (body.fieldsOfActivityIds.length > 0) {
            await tx.insert(entityFieldsOfActivity).values(
              body.fieldsOfActivityIds.map((taxonomyId) => ({
                entityId: id,
                taxonomyId,
              })),
            )
          }
        }

        const versions = await tx
          .select()
          .from(entityVersions)
          .where(eq(entityVersions.entityId, id))
          .orderBy(desc(entityVersions.createdAt))
          .limit(1)

        const lastVersion = versions[0]
        const lastMajor = lastVersion ? Number.parseInt(lastVersion.version, 10) || 0 : 0
        const newVersion = `${lastMajor + 1}.0`

        // Capture current taxonomy relationships for the version snapshot
        const [currentThematic, currentSectors, currentTech, currentUseCases, currentFields] = await Promise.all([
          tx
            .select({ taxonomyId: entityThematicAreas.taxonomyId })
            .from(entityThematicAreas)
            .where(eq(entityThematicAreas.entityId, id)),
          tx.select({ taxonomyId: entitySectors.taxonomyId }).from(entitySectors).where(eq(entitySectors.entityId, id)),
          tx
            .select({ taxonomyId: entityTechnologies.taxonomyId })
            .from(entityTechnologies)
            .where(eq(entityTechnologies.entityId, id)),
          tx
            .select({ taxonomyId: entityUseCases.taxonomyId })
            .from(entityUseCases)
            .where(eq(entityUseCases.entityId, id)),
          tx
            .select({ taxonomyId: entityFieldsOfActivity.taxonomyId })
            .from(entityFieldsOfActivity)
            .where(eq(entityFieldsOfActivity.entityId, id)),
        ])

        await tx.insert(entityVersions).values({
          entityId: id,
          version: newVersion,
          data: {
            ...updated,
            thematicAreaIds: currentThematic.map((r) => r.taxonomyId),
            sectorIds: currentSectors.map((r) => r.taxonomyId),
            technologyIds: currentTech.map((r) => r.taxonomyId),
            useCaseIds: currentUseCases.map((r) => r.taxonomyId),
            fieldsOfActivityIds: currentFields.map((r) => r.taxonomyId),
          },
        })

        return updated
      })

      return reply.send({
        data: updated,
        message: 'Entity updated successfully',
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params)

      const [existing] = await db.select().from(entities).where(eq(entities.id, id)).limit(1)

      if (!existing) {
        return sendErrorReply({ reply, type: 'notFound' })
      }

      await db.delete(entities).where(eq(entities.id, id))

      return reply.send({
        message: 'Entity deleted successfully',
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.post('/:id/sync', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params)

      const result = await entitySyncService.pushEntity(id)

      if (result.success) {
        return reply.send({
          data: result.atlasId,
          message: 'Entity synced to ATLAS successfully',
        })
      }

      return sendErrorReply({
        reply,
        type: result.error === 'CONFLICT' ? 'conflict' : 'unexepected',
        message: result.error,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.get('/:id/versions', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params)

      const versions = await db
        .select()
        .from(entityVersions)
        .where(eq(entityVersions.entityId, id))
        .orderBy(desc(entityVersions.createdAt))

      return reply.send({
        data: versions,
        meta: {
          count: versions.length,
        },
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })
}
