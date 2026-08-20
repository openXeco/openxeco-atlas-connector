import type { AtlasClient, AtlasCluster, AtlasJsonApiResource } from '@/actions/atlas/types.js'
import { toClusterFromResource } from '@/actions/atlas/utils/transformers.js'
import { getSetting } from '@/actions/app/common.js'
import { SETTINGS_KEYS } from '@/config/constants.js'
import { db } from '@/config/database.js'

export const getClusterByID = async (id: string, atlasClient: AtlasClient): Promise<AtlasCluster> => {
  const cluster = await atlasClient.get<AtlasJsonApiResource>(`/node/cluster/${id}`)

  return toClusterFromResource(cluster.data as AtlasJsonApiResource)
}
/**
 * Retrieves all remote entities searching for registration number (and fixed country)
 * @param regNumber
 * @param atlasIds if provided it's a list of ids to exclude from the results
 * @param atlasClient
 */
export const getClustersByRegistrationCode = async (
  regNumber: string,
  atlasIds: string[],
  atlasClient: AtlasClient,
) => {
  if (!regNumber.trim().length) {
    return []
  }

  const countryCode = await getSetting(SETTINGS_KEYS.COUNTRY, db)

  const list = await atlasClient.get<AtlasJsonApiResource[]>('/node/cluster/', {
    filter: {
      registration_number: {
        path: 'field_registration_number',
        operator: '=',
        value: regNumber,
      },
      country_code: {
        path: 'field_country_code',
        operator: '=',
        value: countryCode,
      },
    },
  })

  if (list?.data?.length) {
    return list.data.filter((c) => !atlasIds?.includes(c.id)).map((c) => toClusterFromResource(c))
  }

  return []
}
export const wasClusterRemotelyModified = (lastSyncedAt: Date | null, remoteUpdatedAt?: string): boolean => {
  if (!lastSyncedAt || !remoteUpdatedAt) {
    return true
  }

  const remoteDate = new Date(remoteUpdatedAt)

  if (Number.isNaN(remoteDate.getTime())) {
    return true
  }

  return remoteDate > lastSyncedAt
}
