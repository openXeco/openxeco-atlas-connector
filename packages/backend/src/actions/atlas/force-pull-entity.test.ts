import { beforeEach, describe, expect, it, vi } from 'vitest'

import { forcePullEntity } from '@/actions/atlas/force-pull-entity.js'
import { replaceLocalEntityFromAtlas } from '@/actions/atlas/internal/replace-local-entity-from-atlas.js'
import { getClusterByID } from '@/actions/atlas/utils/atlas-clusters.js'
import { AtlasApiError } from '@/actions/atlas/utils/atlas-api-error.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import { markEntityAsFailedSync, markEntityAsNotFound } from '@/actions/entities/common.js'
import { makeAtlasClient, makeDb, makeLogger } from '@/actions/atlas/test-support/fakes.js'
import { makeAtlasCluster, makeEntity } from '@/actions/atlas/test-support/fixtures.js'

vi.mock('@/actions/atlas/internal/replace-local-entity-from-atlas.js', () => ({
  replaceLocalEntityFromAtlas: vi.fn(),
}))

vi.mock('@/actions/atlas/utils/atlas-clusters.js', () => ({
  getClusterByID: vi.fn(),
}))

vi.mock('@/actions/entities/get-entity.js', () => ({
  getEntity: vi.fn(),
}))

vi.mock('@/actions/entities/common.js', () => ({
  markEntityAsFailedSync: vi.fn(),
  markEntityAsNotFound: vi.fn(),
}))

const getClusterByIDMock = vi.mocked(getClusterByID)
const getEntityMock = vi.mocked(getEntity)
const markEntityAsFailedSyncMock = vi.mocked(markEntityAsFailedSync)
const markEntityAsNotFoundMock = vi.mocked(markEntityAsNotFound)
const replaceLocalEntityFromAtlasMock = vi.mocked(replaceLocalEntityFromAtlas)

const atlasClient = makeAtlasClient().client
const db = makeDb()
const logger = makeLogger().logger

const callForcePullEntity = (id = 'entity-1') =>
  forcePullEntity({ id, db, logger, dependencies: { atlasClient } })

describe('forcePullEntity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getEntityMock.mockResolvedValue({
      success: true,
      data: makeEntity({
        atlasId: 'atlas-1',
        syncStatus: 'failed',
        syncCode: 'conflict',
      }),
    })
  })

  it('replaces the local version with ATLAS data', async () => {
    const remote = makeAtlasCluster({ atlasId: 'atlas-1' })
    getClusterByIDMock.mockResolvedValue(remote)

    await expect(callForcePullEntity()).resolves.toEqual({
      success: true,
      data: {
        code: 'synced',
        entityId: 'entity-1',
        atlasId: 'atlas-1',
      },
    })

    expect(replaceLocalEntityFromAtlasMock).toHaveBeenCalledWith('entity-1', remote, db)
  })

  it('returns not linked when the entity has no atlas id', async () => {
    getEntityMock.mockResolvedValue({
      success: true,
      data: makeEntity({ atlasId: null, syncStatus: 'failed', syncCode: 'conflict' }),
    })

    await expect(callForcePullEntity()).resolves.toEqual({
      success: true,
      data: { code: 'not_linked', entityId: 'entity-1' },
    })

    expect(getClusterByIDMock).not.toHaveBeenCalled()
  })

  it('does not force an entity that is not in conflict', async () => {
    getEntityMock.mockResolvedValue({
      success: true,
      data: makeEntity({ atlasId: 'atlas-1', syncStatus: 'synced', syncCode: null }),
    })

    await expect(callForcePullEntity()).resolves.toEqual({
      success: true,
      data: { code: 'no_conflict', entityId: 'entity-1' },
    })

    expect(getClusterByIDMock).not.toHaveBeenCalled()
  })

  it('records a confirmed missing remote entity', async () => {
    getClusterByIDMock.mockRejectedValue(new AtlasApiError('Not found', 404))

    await expect(callForcePullEntity()).resolves.toEqual({
      success: true,
      data: {
        code: 'remote_not_found',
        entityId: 'entity-1',
        atlasId: 'atlas-1',
      },
    })

    expect(markEntityAsNotFoundMock).toHaveBeenCalledOnce()
    expect(markEntityAsNotFoundMock.mock.calls[0]?.[0]).toBe('entity-1')
    expect(replaceLocalEntityFromAtlasMock).not.toHaveBeenCalled()
  })

  it('marks synchronization as failed when pulling from ATLAS fails', async () => {
    const error = new AtlasApiError('Unavailable', 503)
    getClusterByIDMock.mockRejectedValue(error)

    await expect(callForcePullEntity()).resolves.toEqual({
      success: false,
      code: 'external',
      message: 'Unable to force pull entity entity-1 from ATLAS.',
      error,
    })

    expect(markEntityAsFailedSyncMock).toHaveBeenCalledOnce()
    expect(markEntityAsFailedSyncMock.mock.calls[0]?.[0]).toBe('entity-1')
  })
})
