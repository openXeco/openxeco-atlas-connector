import type { AtlasFieldComparable, AtlasClusterInput, AtlasCluster } from '@/actions/atlas/types.js'
import { atlasClusterTaxonomies, atlasFieldsComparable } from '@/actions/atlas/constants.js'
import { normalizeField, findChangedKeys } from '@/actions/atlas/utils/utils.js'

export const normalizeClusterField = (
  field: AtlasFieldComparable,
  value: AtlasClusterInput[AtlasFieldComparable] | null,
): unknown => {
  // ATLAS represents an absent value as null while the local
  // transformer represents it as undefined.
  return atlasClusterTaxonomies.has(field) ? normalizeField(Array.isArray(value) ? value : []) : normalizeField(value)
}

export const findConflictFields = (local: AtlasClusterInput, remote: AtlasCluster): AtlasFieldComparable[] =>
  findChangedKeys(local, remote, atlasFieldsComparable, (field, value) =>
    normalizeClusterField(field, value as AtlasClusterInput[AtlasFieldComparable] | null),
  )
