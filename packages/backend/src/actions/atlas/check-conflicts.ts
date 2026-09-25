import { inArray } from 'drizzle-orm'
import type { ActionArgsWithDb, ActionResult } from '@/types.js'
import type { AtlasActionDependencies, CheckConflictsResult, AtlasFieldComparable } from '@/actions/atlas/types.js'
import { AtlasApiError } from '@/actions/atlas/utils/atlas-api-error.js'
import { getClusterByID } from '@/actions/atlas/utils/atlas-clusters.js'
import { findConflictFields } from '@/actions/atlas/utils/conflicts.js'
import { toClusterInputFromEntity } from '@/actions/atlas/utils/transformers.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import { taxonomies } from '@/db/schema.js'

const taxonomyTypes: Partial<Record<AtlasFieldComparable, string>> = {
  clusterTypeId: 'cluster_type',
  thematicAreaIds: 'cluster_thematic_area',
  sectorIds: 'sectors',
  technologyIds: 'technologies',
  useCaseIds: 'use_cases',
  fieldsOfActivityIds: 'fields_of_activity',
}

/** Returns remote conflict values, with taxonomy names instead of IDs, without changing sync state. */
export const checkConflicts = async ({
  id,
  db,
  logger,
  dependencies: { atlasClient },
}: ActionArgsWithDb<undefined, AtlasActionDependencies>): Promise<ActionResult<CheckConflictsResult>> => {
  if (!id) {
    return { success: false, code: 'validation', message: 'Entity id is required.' }
  }

  const entityResult = await getEntity({ id, db, logger })

  if (!entityResult.success) {
    return entityResult
  }

  const entity = entityResult.data

  if (!entity.atlasId) {
    return {
      success: false,
      code: 'validation',
      message: `The entity ${id} is not linked with any ATLAS counterpart.`,
    }
  }

  try {
    const remote = await getClusterByID(entity.atlasId, atlasClient)
    const conflictFields = findConflictFields(toClusterInputFromEntity(entity), remote)

    const taxonomyTypeById = new Map<string, string>()
    for (const field of conflictFields) {
      const type = taxonomyTypes[field]
      const value = remote[field]
      if (!type || value == null) continue
      for (const atlasId of Array.isArray(value) ? value : [value]) {
        if (typeof atlasId === 'string') taxonomyTypeById.set(atlasId, type)
      }
    }

    const rows = taxonomyTypeById.size
      ? await db
          .select({ atlasId: taxonomies.atlasId, name: taxonomies.name })
          .from(taxonomies)
          .where(inArray(taxonomies.atlasId, [...taxonomyTypeById.keys()]))
      : []
    const names = new Map(rows.map((term) => [term.atlasId, term.name]))

    return {
      success: true,
      data: Object.fromEntries(
        conflictFields.map((field) => {
          const value = remote[field] ?? null
          if (!taxonomyTypes[field] || value === null) return [field, value]
          return [field, Array.isArray(value) ? value.map((id) => names.get(id)) : names.get(String(value))]
        }),
      ),
    }
  } catch (error) {
    if (error instanceof AtlasApiError && error.status === 404) {
      return {
        success: false,
        code: 'notFound',
        message: `Remote entity ${entity.atlasId} not found.`,
      }
    }

    return {
      success: false,
      code: 'external',
      message: `Unable to check conflicts for entity ${id} in ATLAS.`,
      error: error as Error,
    }
  }
}
