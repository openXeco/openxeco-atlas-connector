import type { PgTable, PgAsyncTransaction } from 'drizzle-orm/pg-core'
import type { CreateOrUpdateEntity } from '@/actions/entities/types.js'
import { createOrUpdateEntitySchema } from '@/actions/entities/constants.js'
import type { DB, Logger } from '@/types.js'
import { entities, type Entity } from '@/db/schema.js'
import { eq, isNotNull } from 'drizzle-orm'

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

    status: data.status || 'draft',
  }
}

export const canEntityBePushed = (entity: Entity) => entity.syncStatus === 'pending_push'

export const getEntitiesIdWithAtlasId = async (db: DB) => {
  const rows = await db.select({ atlasId: entities.atlasId }).from(entities).where(isNotNull(entities.atlasId))

  // biome-ignore lint/style/noNonNullAssertion: Drizzle doesn not type `isNotNull` unfortunately
  return rows.map((r) => r.atlasId!)
}

export const markEntityAsSynced = async (id: string, atlasId: string, db: DB, logger: Logger): Promise<void> => {
  logger.info(`Mark entity ${id} as synced`)
  await db
    .update(entities)
    .set({
      atlasId,
      syncStatus: 'synced',
      syncCode: null,
      updatedAt: new Date(),
      lastSyncedAt: new Date(),
    })
    .where(eq(entities.id, id))
}

export const markEntityAsConflict = async (
  id: string,
  db: DB,
  logger: Logger,
  _conflictFields: string[],
): Promise<void> => {
  logger.info(`Mark entity ${id} as conflict`)
  await db
    .update(entities)
    .set({
      syncStatus: 'failed',
      syncCode: 'conflict',
      updatedAt: new Date(),
    })
    .where(eq(entities.id, id))

  //@TODO Save conflict fields
}

export const markEntityAsFailedSync = async (id: string, db: DB, logger: Logger): Promise<void> => {
  logger.info(`Mark entity ${id} as conflict`)
  await db
    .update(entities)
    .set({
      syncStatus: 'failed',
      syncCode: null,
      updatedAt: new Date(),
    })
    .where(eq(entities.id, id))
}

export const saveTaxonomy = async (
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
