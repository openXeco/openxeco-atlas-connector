import { entities } from '@/db/schema.js'
import { eq } from 'drizzle-orm'
import type { ActionArgs, ActionResult } from '@/types.js'

export const deleteEntity = async ({ id, db }: ActionArgs): Promise<ActionResult> => {
  if (!id) {
    return {
      success: false,
      code: 'validation',
      message: 'id is required',
    }
  }

  await db.delete(entities).where(eq(entities.id, id))

  return {
    success: true,
    message: 'Entity successfully deleted.',
  }
}
