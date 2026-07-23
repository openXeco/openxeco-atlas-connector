import type { ActionProps } from '@/actions/types.js'
import {
  entities,
  entityThematicAreas,
  entitySectors,
  entityTechnologies,
  entityUseCases,
  entityFieldsOfActivity,
} from '@/db/schema.js'
import { validateEntity, prepareEntity, saveTaxonomy } from '@/actions/entities/common.js'

export const createEntity = async ({ data, db }: ActionProps) => {
  const body = validateEntity(data)

  return await db.transaction(async (tx) => {
    const [entity] = await tx
      .insert(entities)
      .values({
        ...prepareEntity(body),
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

    return entity
  })
}
