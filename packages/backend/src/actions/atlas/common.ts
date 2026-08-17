import { atlasClient } from '@/services/atlas/client.js'
import { SETTINGS_KEYS } from '@/config/constants.js'
import { getSetting } from '@/actions/app/common.js'
import { db } from '@/config/database.js'
import type {
  AtlasApiError as IAtlasApiError,
  AtlasJsonApiError,
  AtlasRequestParams,
  AtlasClient,
  AtlasJsonApiResource,
} from '@/actions/atlas/types.js'
import type { Logger } from '@/types.js'

export class AtlasApiError extends Error implements IAtlasApiError {
  constructor(
    message: string,
    readonly status: number,
    readonly errors?: AtlasJsonApiError[],
  ) {
    super(message)
    this.name = 'AtlasApiError'
    Object.setPrototypeOf(this, AtlasApiError.prototype)
  }
}

type PaginationProps = {
  path: string
  params?: AtlasRequestParams['params']
  limit?: number
  pageDelayMs?: number
  logger: Logger
  atlasClient: AtlasClient
}

export const paginate = async ({ path, params = {}, limit = 50, pageDelayMs = 1500, atlasClient }: PaginationProps) => {
  let offset = 0

  let result: AtlasJsonApiResource[] = []

  while (true) {
    const response = await atlasClient.get<AtlasJsonApiResource[]>(path, {
      ...params,
      pageOffset: offset,
      pageLimit: limit,
    })

    if (!response.data) {
      break
    }

    result = [...result, ...response.data]

    if (response.data.length < limit || !response.links?.next) {
      break
    }

    offset += limit

    await wait(pageDelayMs)
  }

  return result
}

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
    return []
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

  return []
}

export const wait = async (delayMs: number) => await new Promise((resolve) => setTimeout(resolve, delayMs))
