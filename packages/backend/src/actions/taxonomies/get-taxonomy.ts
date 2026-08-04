import type { ActionResult, ActionArgs } from '@/types.js'
import { type Taxonomy, taxonomies } from '@/db/schema.js'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const getTaxonomy = async ({ db, logger, id }: ActionArgs): Promise<ActionResult<Taxonomy>> => {
  try {
    if (!id) {
      return {
        success: false,
        code: 'validation',
        message: 'Taxonomy ID required.',
      }
    }

    const [taxonomy] = await db.select().from(taxonomies).where(eq(taxonomies.id, id)).limit(1)

    if (!taxonomy) {
      return {
        success: false,
        code: 'notFound',
        message: 'Taxonomy Not Found.',
      }
    }

    return {
      success: true,
      data: taxonomy,
    }
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
