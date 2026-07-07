import z from 'zod'
import type { ActionProps, CreateOrUpdateEntity } from '@/actions/types.js'
import {
  entities,
  entityThematicAreas,
  entitySectors,
  entityTechnologies,
  entityUseCases,
  entityFieldsOfActivity,
  entityVersions,
  type Entity,
} from '@/db/schema.js'
import type { PgTable, PgAsyncTransaction } from 'drizzle-orm/pg-core'
import { eq, desc } from 'drizzle-orm'

export const createEntity = async ({ data, db }: ActionProps) => {
  const body = validateEntity(data)

  return await db.transaction(async (tx) => {
    const [entity] = await tx
      .insert(entities)
      .values({
        ...prepareEntity(body),
        syncStatus: 'local',
      })
      .returning()

    await Promise.all([
      saveTaxonomy(entity.id, body.thematicAreaIds, tx, entityThematicAreas),
      saveTaxonomy(entity.id, body.sectorIds, tx, entitySectors),
      saveTaxonomy(entity.id, body.technologyIds, tx, entityTechnologies),
      saveTaxonomy(entity.id, body.useCaseIds, tx, entityUseCases),
      saveTaxonomy(entity.id, body.fieldsOfActivityIds, tx, entityFieldsOfActivity),
    ])

    await createVersion(
      entity,
      {
        thematicAreaIds: body.thematicAreaIds || [],
        sectorIds: body.sectorIds || [],
        technologyIds: body.technologyIds || [],
        useCaseIds: body.useCaseIds || [],
        fieldsOfActivityIds: body.fieldsOfActivityIds || [],
      },
      tx,
    )

    return entity
  })
}

export const updateEntity = async ({ data, db, id }: ActionProps) => {
  const body = validateEntity(data)

  if (!id) {
    throw new Error('id is required')
  }

  const [existing] = await db.select().from(entities).where(eq(entities.id, id)).limit(1)

  if (!existing) {
    throw new Error('Entity not found')
  }

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(entities)
      .set({
        ...prepareEntity(body),
        updatedAt: new Date(),
      })
      .where(eq(entities.id, id))
      .returning()

    // We expect the client providing all the taxonomies so we delete them before saving the new ones
    await Promise.all([
      tx.delete(entityThematicAreas).where(eq(entityThematicAreas.entityId, id)),
      tx.delete(entitySectors).where(eq(entitySectors.entityId, id)),
      tx.delete(entityTechnologies).where(eq(entityTechnologies.entityId, id)),
      tx.delete(entityUseCases).where(eq(entityUseCases.entityId, id)),
      tx.delete(entityFieldsOfActivity).where(eq(entityFieldsOfActivity.entityId, id)),
    ])

    await Promise.all([
      saveTaxonomy(id, body.thematicAreaIds, tx, entityThematicAreas),
      saveTaxonomy(id, body.sectorIds, tx, entitySectors),
      saveTaxonomy(id, body.technologyIds, tx, entityTechnologies),
      saveTaxonomy(id, body.useCaseIds, tx, entityUseCases),
      saveTaxonomy(id, body.fieldsOfActivityIds, tx, entityFieldsOfActivity),
    ])

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
      tx.select({ taxonomyId: entityUseCases.taxonomyId }).from(entityUseCases).where(eq(entityUseCases.entityId, id)),
      tx
        .select({ taxonomyId: entityFieldsOfActivity.taxonomyId })
        .from(entityFieldsOfActivity)
        .where(eq(entityFieldsOfActivity.entityId, id)),
    ])

    await createVersion(
      updated,
      {
        thematicAreaIds: currentThematic.map((r) => r.taxonomyId),
        sectorIds: currentSectors.map((r) => r.taxonomyId),
        technologyIds: currentTech.map((r) => r.taxonomyId),
        useCaseIds: currentUseCases.map((r) => r.taxonomyId),
        fieldsOfActivityIds: currentFields.map((r) => r.taxonomyId),
      },
      tx,
    )

    return updated
  })
}

export const baseEntitySchema = z.object({
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

export const createOrUpdateEntitySchema = baseEntitySchema
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

export const validateEntity = (data: unknown) => createOrUpdateEntitySchema.parse(data)

export const prepareEntity = (data: CreateOrUpdateEntity) => {
  return {
    // Basic information
    name: data.name,
    nameNational: data.nameNational,
    entityDepartment: data.entityDepartment,

    // Address
    countryCode: data.countryCode,
    city: data.city,
    streetAddress: data.streetAddress,

    // Organisation details
    email: data.email,
    phone: data.phone,
    website: data.website,
    registrationNumber: data.registrationNumber,

    // Headquarters
    isHeadquarter: data.isHeadquarter,
    headquarterInfo: data.headquarterInfo,

    // Subsidiaries
    hasSubsidiaries: data.hasSubsidiaries,
    subsidiariesDetails: data.subsidiariesDetails,
    hasMajorityShares: data.hasMajorityShares,
    majoritySharesDetails: data.majoritySharesDetails,

    // Compliance
    article138Compliance: data.article138Compliance,
    dataShareConsent: data.dataShareConsent,

    // Contact person
    contactFirstName: data.contactFirstName,
    contactLastName: data.contactLastName,
    contactEmail: data.contactEmail,
    contactPosition: data.contactPosition,
    contactPhone: data.contactPhone,

    // Expertise
    expertiseDescription: data.expertiseDescription,
    goalsToAchieve: data.goalsToAchieve,
    goalsToContribute: data.goalsToContribute,

    // Consent fields
    dataProtectionConsent: data.dataProtectionConsent,
    formCompletionConfirmed: data.formCompletionConfirmed,

    // Taxonomy references
    countryId: data.countryId,
    clusterTypeId: data.clusterTypeId,

    // Workflow
    status: 'draft',
    moderationState: data.moderationState || 'draft',
  }
}

const saveTaxonomy = async (
  id: string,
  data: string[] | undefined | null,
  // biome-ignore lint/suspicious/noExplicitAny: We need it here
  tx: PgAsyncTransaction<any>,
  table: PgTable,
) => {
  if (data && data.length > 0) {
    await tx.insert(table).values(
      data.map((taxonomyId) => ({
        entityId: id,
        taxonomyId,
      })),
    )
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Same as before. Needed
const createVersion = async (entity: Entity, taxonomies: unknown, tx: PgAsyncTransaction<any>) => {
  const [lastVersion] = await tx
    .select()
    .from(entityVersions)
    .where(eq(entityVersions.entityId, entity.id))
    .orderBy(desc(entityVersions.createdAt))
    .limit(1)

  const lastMajor = lastVersion ? Number.parseInt(lastVersion.version, 10) || 0 : 0
  const newVersion = `${lastMajor + 1}.0`

  await tx.insert(entityVersions).values({
    entityId: entity.id,
    version: newVersion,
    data: {
      ...entity,
      taxonomies,
    },
  })
}
