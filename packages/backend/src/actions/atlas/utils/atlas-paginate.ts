import type { AtlasJsonApiResource, AtlasRequestParams, AtlasClient } from '@/actions/atlas/types.js'
import type { Logger } from '@/types.js'

import { wait } from '@/actions/atlas/utils/utils.js'

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
