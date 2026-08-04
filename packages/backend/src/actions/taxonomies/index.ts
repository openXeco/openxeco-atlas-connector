import type { DB, ActionArgs } from '@/types.js'
import type { TaxonomyType } from '@/services/atlas/types.js'
import { handleActionResult } from '@/utils/action-helpers.js'
import { countTaxonomies } from '@/actions/taxonomies/count-taxonomies.js'
import { getTaxonomyByType } from '@/actions/taxonomies/get-taxonomy-by-type.js'
import { getTaxonomy } from '@/actions/taxonomies/get-taxonomy.js'

export const taxonomyActions = (db: DB, logger: ActionArgs['logger']) => {
  return {
    count: async (type?: TaxonomyType) => handleActionResult(await countTaxonomies({ db, logger, data: { type } })),
    get: async (id: string) => handleActionResult(await getTaxonomy({ id, db, logger })),
    getByType: async (type?: TaxonomyType) =>
      handleActionResult(await getTaxonomyByType({ data: { type }, db, logger })),
  }
}
