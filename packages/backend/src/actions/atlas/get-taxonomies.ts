import type { ActionResult, TaxonomyType, BaseActionArgs } from '@/types.js'
import type { AtlasTaxonomyTerm, AtlasJsonApiResource } from '@/actions/atlas/types.js'
import type { getAtlasClient } from '@/actions/atlas/atlas-client.js'
import { toTaxonomyTermFromResource } from '@/actions/atlas/transformers.js'
import { paginate } from '@/actions/atlas/common.js'

export const getTaxonomies = async ({
  data: { type },
  logger,
  dependencies: { atlasClient },
}: BaseActionArgs<{ type: TaxonomyType }, { atlasClient: ReturnType<typeof getAtlasClient> }>): Promise<
  ActionResult<AtlasTaxonomyTerm[]>
> => {
  const taxonomyResources = await paginate({ path: `/taxonomy_term/${type}`, atlasClient, logger })
  const taxonomies = taxonomyResources.map((res: AtlasJsonApiResource) => toTaxonomyTermFromResource(res, type))

  return {
    success: true,
    data: taxonomies || [],
  }
}
