import {
  entities,
  entityThematicAreas,
  entitySectors,
  entityTechnologies,
  entityUseCases,
  entityFieldsOfActivity,
  type Entity,
} from '@/db/schema.js'
import { eq } from 'drizzle-orm'
import { validateEntity, prepareEntity, saveTaxonomy } from '@/actions/entities/common.js'
import type { ActionArgs, ActionResult } from '@/types.js'
import { z } from 'zod'

export const updateEntity = async ({ data, db, id, logger }: ActionArgs<unknown>): Promise<ActionResult<Entity>> => {
  try {
    const body = validateEntity(data)

    if (!id) {
      return {
        success: false,
        code: 'validation',
        message: 'id is required.',
      }
    }

    const [existing] = await db.select().from(entities).where(eq(entities.id, id)).limit(1)

    if (!existing) {
      return {
        success: false,
        code: 'notFound',
        message: `Entity with id ${id} not found.`,
      }
    }

    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(entities)
        .set({
          ...prepareEntity(body),
          syncStatus: 'pending_push',
          syncCode: null,
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

      return {
        success: true,
        data: updated,
      }
    })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return {
        success: false,
        code: 'validation',
        error: e,
      }
    }

    logger.error(e)
    return {
      success: false,
      code: 'unexpected',
      message: (e as Error).message,
    }
  }
}
