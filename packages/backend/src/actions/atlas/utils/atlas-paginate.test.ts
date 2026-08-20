import { beforeEach, describe, expect, it, vi } from 'vitest'

import { paginate } from '@/actions/atlas/utils/atlas-paginate.js'
import { wait } from '@/actions/atlas/utils/utils.js'
import { makeAtlasClient, makeLogger } from '@/actions/atlas/test-support/fakes.js'
import { makeAtlasResource } from '@/actions/atlas/test-support/fixtures.js'

vi.mock('@/actions/atlas/utils/utils.js', () => ({
  wait: vi.fn(),
}))

const waitMock = vi.mocked(wait)

describe('paginate', () => {
  const atlas = makeAtlasClient()
  const logger = makeLogger().logger

  beforeEach(() => {
    atlas.get.mockReset()
    waitMock.mockReset()
    waitMock.mockResolvedValue(undefined)
  })

  it('collects every page while preserving query parameters and advancing the offset', async () => {
    const firstPage = [makeAtlasResource({ id: 'atlas-1' }), makeAtlasResource({ id: 'atlas-2' })]
    const secondPage = [makeAtlasResource({ id: 'atlas-3' })]
    atlas.get
      .mockResolvedValueOnce({ data: firstPage, links: { next: '/node/cluster?page[offset]=2' } })
      .mockResolvedValueOnce({ data: secondPage })

    await expect(
      paginate({
        path: '/node/cluster',
        params: { sort: 'title' },
        limit: 2,
        pageDelayMs: 25,
        logger,
        atlasClient: atlas.client,
      }),
    ).resolves.toEqual([...firstPage, ...secondPage])

    expect(atlas.get).toHaveBeenNthCalledWith(1, '/node/cluster', {
      sort: 'title',
      pageOffset: 0,
      pageLimit: 2,
    })
    expect(atlas.get).toHaveBeenNthCalledWith(2, '/node/cluster', {
      sort: 'title',
      pageOffset: 2,
      pageLimit: 2,
    })
    expect(waitMock).toHaveBeenCalledOnce()
    expect(waitMock).toHaveBeenCalledWith(25)
  })

  it('stops after a full page when ATLAS does not provide a next link', async () => {
    const page = [makeAtlasResource({ id: 'atlas-1' }), makeAtlasResource({ id: 'atlas-2' })]
    atlas.get.mockResolvedValue({ data: page })

    await expect(
      paginate({ path: '/node/cluster', limit: 2, logger, atlasClient: atlas.client }),
    ).resolves.toEqual(page)

    expect(atlas.get).toHaveBeenCalledOnce()
    expect(waitMock).not.toHaveBeenCalled()
  })

  it('returns the accumulated results when a response has no data', async () => {
    const firstPage = [makeAtlasResource({ id: 'atlas-1' })]
    atlas.get
      .mockResolvedValueOnce({ data: firstPage, links: { next: '/node/cluster?page[offset]=1' } })
      .mockResolvedValueOnce({})

    await expect(
      paginate({ path: '/node/cluster', limit: 1, pageDelayMs: 0, logger, atlasClient: atlas.client }),
    ).resolves.toEqual(firstPage)

    expect(atlas.get).toHaveBeenCalledTimes(2)
    expect(waitMock).toHaveBeenCalledOnce()
  })
})
