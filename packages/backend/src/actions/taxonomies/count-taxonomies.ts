import type { ActionArgsWithDb, ActionResult, TaxonomyType } from '@/types.js'
import { taxonomies } from '@/db/schema.js'
import { sql, count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { taxonomyTypeSchema } from '@/config/constants.js'

export const countTaxonomies = async ({
  db,
  logger,
  data: { type },
}: ActionArgsWithDb<{ type?: string }>): Promise<
  ActionResult<{ total: number; taxonomies?: Record<TaxonomyType, number> }>
> => {
  try {
    if (!type) {
      const rows = await db
        .select({
          taxonomyType: taxonomies.taxonomyType,
          count: sql<number>`count(*)`,
        })
        .from(taxonomies)
        .groupBy(taxonomies.taxonomyType)

      const taxonomiesRecord = {} as Record<TaxonomyType, number>

      for (const row of rows) {
        taxonomiesRecord[row.taxonomyType as TaxonomyType] = row.count
      }

      const total = rows.reduce((sum, r) => sum + Number(r.count), 0)

      return { success: true, data: { total, taxonomies: taxonomiesRecord } }
    }

    const validatedType = taxonomyTypeSchema.parse(type)

    const [result] = await db
      .select({ total: count() })
      .from(taxonomies)
      .where(eq(taxonomies.taxonomyType, validatedType as TaxonomyType))

    return { success: true, data: { total: result.total } }
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
