import { getEntity } from '@/actions/entities/get-entity.js'
import { getEntities } from '@/actions/entities/get-entities.js'
import type { DB, ActionArgs } from '@/types.js'
import type { ListQuery } from '@/actions/entities/common.js'
import { createEntity } from '@/actions/entities/create-entity.js'
import { updateEntity } from '@/actions/entities/update-entity.js'
import { deleteEntity } from '@/actions/entities/delete-entity.js'
import { handleActionResult } from '@/utils/action-helpers.js'

export const entityActions = (db: DB, logger: ActionArgs['logger']) => {
  return {
    get: async (id: string) => handleActionResult(await getEntity({ id, db, logger: logger })),
    list: async (query: ListQuery) => handleActionResult(await getEntities({ data: query, db, logger: logger })),
    create: async (data: unknown) => handleActionResult(await createEntity({ data, db, logger: logger })),
    update: async (id: string, data: unknown) =>
      handleActionResult(await updateEntity({ id, data, db, logger: logger })),
    delete: async (id: string) => handleActionResult(await deleteEntity({ id, db, logger: logger })),
  }
}
