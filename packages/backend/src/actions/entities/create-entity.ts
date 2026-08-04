import {
  entities,
  entityThematicAreas,
  entitySectors,
  entityTechnologies,
  entityUseCases,
  entityFieldsOfActivity,
  type Entity,
} from '@/db/schema.js'
import { validateEntity, prepareEntity, saveTaxonomy } from '@/actions/entities/common.js'
import type { ActionArgs, ActionResult } from '@/types.js'
import { z } from 'zod'

export const createEntity = async ({ data, db, logger }: ActionArgs<unknown>): Promise<ActionResult<Entity>> => {
  try {
    const body = validateEntity(data)

    return await db.transaction(async (tx) => {
      const [entity] = await tx
        .insert(entities)
        .values({
          ...prepareEntity(body),
          atlasId: null,
          syncStatus: 'pending_push',
          syncCode: null,
        })
        .returning()

      await Promise.all([
        saveTaxonomy(entity.id, body.thematicAreaIds, tx, entityThematicAreas),
        saveTaxonomy(entity.id, body.sectorIds, tx, entitySectors),
        saveTaxonomy(entity.id, body.technologyIds, tx, entityTechnologies),
        saveTaxonomy(entity.id, body.useCaseIds, tx, entityUseCases),
        saveTaxonomy(entity.id, body.fieldsOfActivityIds, tx, entityFieldsOfActivity),
      ])

      return {
        success: true,
        data: entity,
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
