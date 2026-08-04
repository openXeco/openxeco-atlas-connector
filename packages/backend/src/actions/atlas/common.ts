import { atlasClient } from '@/services/atlas/client.js'
import { SETTINGS_KEYS } from '@/config/constants.js'
import { getSetting } from '@/actions/app/common.js'
import { db } from '@/config/database.js'

export const getClusterByID = async (id: string) => {
  try {
    return await atlasClient.getCluster(id)
  } catch {
    return undefined
  }
}

/**
 * Retrieves all remote entities searching for registration number (and fixed country)
 * @param regNumber
 * @param atlasIds if provided it's a list of ids to exclude from the results
 */
export const getClustersByRegistrationCode = async (regNumber: string, atlasIds: string[] = []) => {
  if (!regNumber.trim().length) {
    return undefined
  }

  const countryCode = await getSetting(SETTINGS_KEYS.COUNTRY, db)

  const list = await atlasClient.getClusters({
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

  if (list.data.length > 0) {
    return list.data.filter((c) => !atlasIds?.includes(c.atlasId))
  }

  return undefined
}
