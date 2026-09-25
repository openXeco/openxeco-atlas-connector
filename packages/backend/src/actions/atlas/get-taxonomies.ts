import type { ActionResult, TaxonomyType, BaseActionArgs } from '@/types.js'
import type { AtlasTaxonomyTerm, AtlasJsonApiResource, AtlasActionDependencies } from '@/actions/atlas/types.js'
import { toTaxonomyTermFromResource } from '@/actions/atlas/utils/transformers.js'

import { paginate } from '@/actions/atlas/utils/atlas-paginate.js'

export const getTaxonomies = async ({
  data: { type },
  logger,
  dependencies: { atlasClient },
}: BaseActionArgs<{ type: TaxonomyType }, AtlasActionDependencies>): Promise<ActionResult<AtlasTaxonomyTerm[]>> => {
  const taxonomyResources = await paginate({ path: `/taxonomy_term/${type}`, atlasClient, logger })
  const taxonomies = taxonomyResources.map((res: AtlasJsonApiResource) => toTaxonomyTermFromResource(res, type))

  return {
    success: true,
    data: taxonomies || [],
  }
}
