import { beforeEach, describe, expect, it, vi } from 'vitest'

import { forcePullEntity } from '@/actions/atlas/force-pull-entity.js'
import { replaceLocalEntityFromAtlas } from '@/actions/atlas/internal/replace-local-entity-from-atlas.js'
import { getClusterByID } from '@/actions/atlas/utils/atlas-clusters.js'
import { AtlasApiError } from '@/actions/atlas/utils/atlas-api-error.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import { makeAtlasClient, makeDb, makeLogger } from '@/actions/atlas/test-support/fakes.js'
import { makeAtlasCluster, makeEntity } from '@/actions/atlas/test-support/fixtures.js'
import { finalizeEntitySyncFailure, finalizeEntitySyncSuccess } from '@/actions/atlas/internal/finalize-entity-sync.js'
import type { DB } from '@/types.js'

vi.mock('@/actions/atlas/internal/replace-local-entity-from-atlas.js', () => ({
  replaceLocalEntityFromAtlas: vi.fn(),
}))

vi.mock('@/actions/atlas/utils/atlas-clusters.js', () => ({
  getClusterByID: vi.fn(),
}))

vi.mock('@/actions/entities/get-entity.js', () => ({
  getEntity: vi.fn(),
}))

vi.mock('@/actions/atlas/internal/finalize-entity-sync.js', () => ({
  finalizeEntitySyncFailure: vi.fn(),
  finalizeEntitySyncSuccess: vi.fn(),
}))

const getClusterByIDMock = vi.mocked(getClusterByID)
const getEntityMock = vi.mocked(getEntity)
const finalizeEntitySyncFailureMock = vi.mocked(finalizeEntitySyncFailure)
const finalizeEntitySyncSuccessMock = vi.mocked(finalizeEntitySyncSuccess)
const replaceLocalEntityFromAtlasMock = vi.mocked(replaceLocalEntityFromAtlas)

const atlasClient = makeAtlasClient().client
const tx = makeDb()
const transaction = vi.fn(async (callback: (transactionDb: DB) => unknown) => callback(tx))
const db = { transaction } as unknown as DB
const logger = makeLogger().logger

const callForcePullEntity = (id = 'entity-1') => forcePullEntity({ id, db, logger, dependencies: { atlasClient } })

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

    expect(replaceLocalEntityFromAtlasMock).toHaveBeenCalledWith('entity-1', remote, tx)
    expect(finalizeEntitySyncSuccessMock).toHaveBeenCalledWith('force-pull', 'entity-1', 'atlas-1', db, logger)
  })

  it('returns not linked when the entity has no atlas id', async () => {
    getEntityMock.mockResolvedValue({
      success: true,
      data: makeEntity({ atlasId: null, syncStatus: 'failed', syncCode: 'conflict' }),
    })

    await expect(callForcePullEntity()).resolves.toEqual({
      success: false,
      code: 'validation',
      message: 'The entity entity-1 is not linked with any ATLAS counterpart.',
    })

    expect(getClusterByIDMock).not.toHaveBeenCalled()
  })

  it('does not force an entity that is not in conflict', async () => {
    getEntityMock.mockResolvedValue({
      success: true,
      data: makeEntity({ atlasId: 'atlas-1', syncStatus: 'synced', syncCode: null }),
    })

    await expect(callForcePullEntity()).resolves.toEqual({
      success: false,
      code: 'validation',
      message: 'The entity entity-1 has not conflicts to resolve.',
    })

    expect(getClusterByIDMock).not.toHaveBeenCalled()
  })

  it('records a confirmed missing remote entity', async () => {
    getClusterByIDMock.mockRejectedValue(new AtlasApiError('Not found', 404))

    await expect(callForcePullEntity()).resolves.toEqual({
      success: false,
      code: 'notFound',
      message: 'Remote entity atlas-1 not found.',
    })

    expect(finalizeEntitySyncFailureMock).toHaveBeenCalledWith(
      'force-pull',
      'not_found',
      'entity-1',
      'atlas-1',
      db,
      logger,
    )
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

    expect(finalizeEntitySyncFailureMock).toHaveBeenCalledWith(
      'force-pull',
      'failed',
      'entity-1',
      'atlas-1',
      db,
      logger,
    )
  })
})
