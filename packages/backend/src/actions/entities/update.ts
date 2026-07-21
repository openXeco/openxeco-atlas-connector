import type { ActionProps } from '@/actions/types.js'
import {
  entities,
  entityThematicAreas,
  entitySectors,
  entityTechnologies,
  entityUseCases,
  entityFieldsOfActivity,
} from '@/db/schema.js'
import { eq } from 'drizzle-orm'
import { validateEntity, prepareEntity, saveTaxonomy } from '@/actions/entities/common.js'

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

    return updated
  })
}
