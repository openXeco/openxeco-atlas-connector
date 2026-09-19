import type { ActionResult, ActionArgsWithDb } from '@/types.js'
import type { EntityWithFullRelationships } from '@/actions/entities/types.js'

export const getEntity = async ({
  id,
  db,
  logger,
}: ActionArgsWithDb): Promise<ActionResult<EntityWithFullRelationships>> => {
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
      data: { ...entity, clusterType: entity.clusterType || undefined, country: entity.country || undefined },
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
