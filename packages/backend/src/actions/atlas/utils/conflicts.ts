import type { AtlasFieldComparable, AtlasClusterInput, AtlasCluster } from '@/actions/atlas/types.js'
import { atlasClusterTaxonomies, atlasFieldsComparable } from '@/actions/atlas/constants.js'

export const normalizeClusterField = (
  field: AtlasFieldComparable,
  value: AtlasClusterInput[AtlasFieldComparable] | null,
): unknown => {
  if (atlasClusterTaxonomies.has(field)) {
    return Array.isArray(value) ? [...value].sort() : []
  }

  // ATLAS represents an absent value as null while the local
  // transformer represents it as undefined.
  return value ?? null
}

export const findConflictFields = (local: AtlasClusterInput, remote: AtlasCluster): string[] =>
  atlasFieldsComparable.filter((field) => {
    const localValue = normalizeClusterField(field, local[field])
    const remoteValue = normalizeClusterField(field, remote[field])

    return JSON.stringify(localValue) !== JSON.stringify(remoteValue)
  })
