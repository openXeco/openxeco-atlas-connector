import type { ActionResult, ActionArgsWithDb, TaxonomyType } from '@/types.js'
import { type Taxonomy, taxonomies } from '@/db/schema.js'
import { taxonomyTypeSchema } from '@/config/constants.js'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const getTaxonomyByType = async ({
  db,
  logger,
  data: { type },
}: ActionArgsWithDb<{ type?: string }>): Promise<
  ActionResult<{ taxonomies: Taxonomy[]; meta: { count: number; type: TaxonomyType } }>
> => {
  try {
    const validatedType = taxonomyTypeSchema.parse(type)
    const result = await db
      .select()
      .from(taxonomies)
      .where(eq(taxonomies.taxonomyType, validatedType))
      .orderBy(taxonomies.name)

    return {
      success: true,
      data: {
        taxonomies: result,
        meta: { count: result.length, type: validatedType },
      },
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
