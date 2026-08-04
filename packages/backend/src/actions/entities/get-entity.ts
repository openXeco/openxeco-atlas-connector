import type { Entity } from '@/db/schema.js'
import type { ActionResult, ActionArgs } from '@/types.js'

export const getEntity = async ({ id, db, logger }: ActionArgs): Promise<ActionResult<Entity>> => {
  try {
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
      return {
        success: false,
        code: 'notFound',
        message: `Entity with id ${id} not found.`,
      }
    }

    return {
      success: true,
      data: entity,
    }
  } catch (e) {
    logger.error(e)
    return {
      success: false,
      code: 'unexpected',
      message: (e as Error).message,
    }
  }
}
