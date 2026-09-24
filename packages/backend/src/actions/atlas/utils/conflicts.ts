import type { AtlasFieldComparable, AtlasClusterInput, AtlasCluster } from '@/actions/atlas/types.js'
import { atlasClusterTaxonomies, atlasFieldsComparable } from '@/actions/atlas/constants.js'
import { normalizeField, findChangedKeys } from '@/actions/atlas/utils/utils.js'

export const normalizeClusterField = (
  field: AtlasFieldComparable,
  value: AtlasClusterInput[AtlasFieldComparable] | null,
): unknown => {
  if (atlasClusterTaxonomies.has(field)) {
    return normalizeField(Array.isArray(value) ? value : [])
  }

  // The local national name is scalar; ATLAS can return an empty or singleton array.
  // Keep multiple remote names intact so additional values remain visible as differences.
  if (field === 'nameNational' && Array.isArray(value) && value.length <= 1) {
    return normalizeClusterField(field, value[0])
  }

  // Empty form values and absent ATLAS fields represent the same unset value.
  return normalizeField(value === '' ? null : value)
}

export const findConflictFields = (local: AtlasClusterInput, remote: AtlasCluster): AtlasFieldComparable[] =>
  findChangedKeys(local, remote, atlasFieldsComparable, (field, value) =>
    normalizeClusterField(field, value as AtlasClusterInput[AtlasFieldComparable] | null),
  )
