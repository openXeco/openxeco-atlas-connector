import { beforeEach, describe, expect, it, vi } from 'vitest'

import { findCorrespondences } from '@/actions/atlas/internal/find-correspondences.js'
import { getClustersByRegistrationCode } from '@/actions/atlas/utils/atlas-clusters.js'
import { getEntitiesIdWithAtlasId } from '@/actions/entities/common.js'
import { makeAtlasClient, makeDb } from '@/actions/atlas/test-support/fakes.js'
import { makeAtlasCluster } from '@/actions/atlas/test-support/fixtures.js'

vi.mock('@/actions/atlas/utils/atlas-clusters.js', () => ({
  getClustersByRegistrationCode: vi.fn(),
}))

vi.mock('@/actions/entities/common.js', () => ({
  getEntitiesIdWithAtlasId: vi.fn(),
}))

const getClustersByRegistrationCodeMock = vi.mocked(getClustersByRegistrationCode)
const getEntitiesIdWithAtlasIdMock = vi.mocked(getEntitiesIdWithAtlasId)
const atlasClient = makeAtlasClient().client
const db = makeDb()
const cluster = makeAtlasCluster()

describe('findCorrespondences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('excludes entities already linked to ATLAS', async () => {
    const excludedIds = ['atlas-linked-1', 'atlas-linked-2']
    const matches = [cluster]
    getEntitiesIdWithAtlasIdMock.mockResolvedValue(excludedIds)
    getClustersByRegistrationCodeMock.mockResolvedValue(matches)

    await expect(findCorrespondences('LU-123', atlasClient, db)).resolves.toBe(matches)

    expect(getEntitiesIdWithAtlasIdMock).toHaveBeenCalledWith(db)
    expect(getClustersByRegistrationCodeMock).toHaveBeenCalledWith('LU-123', excludedIds, atlasClient)
  })
})
