import { beforeEach, describe, expect, it, vi } from 'vitest'

import { forcePushEntity } from '@/actions/atlas/force-push-entity.js'
import { updateRemoteEntity } from '@/actions/atlas/internal/update-remote-entity.js'
import { toClusterInputFromEntity } from '@/actions/atlas/utils/transformers.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import {
  markEntityAsFailedSync,
  markEntityAsNotFound,
  markEntityAsPendingPush,
  markEntityAsSynced,
} from '@/actions/entities/common.js'
import { makeAtlasClient, makeDb, makeLogger } from '@/actions/atlas/test-support/fakes.js'
import { makeAtlasCluster, makeAtlasInput, makeEntity } from '@/actions/atlas/test-support/fixtures.js'
import type { DB } from '@/types.js'

vi.mock('@/actions/atlas/internal/update-remote-entity.js', () => ({
  updateRemoteEntity: vi.fn(),
}))

vi.mock('@/actions/atlas/utils/transformers.js', () => ({
  toClusterInputFromEntity: vi.fn(),
}))

vi.mock('@/actions/entities/get-entity.js', () => ({
  getEntity: vi.fn(),
}))

vi.mock('@/actions/entities/common.js', () => ({
  markEntityAsFailedSync: vi.fn(),
  markEntityAsNotFound: vi.fn(),
  markEntityAsPendingPush: vi.fn(),
  markEntityAsSynced: vi.fn(),
}))

const getEntityMock = vi.mocked(getEntity)
const markEntityAsFailedSyncMock = vi.mocked(markEntityAsFailedSync)
const markEntityAsNotFoundMock = vi.mocked(markEntityAsNotFound)
const markEntityAsPendingPushMock = vi.mocked(markEntityAsPendingPush)
const markEntityAsSyncedMock = vi.mocked(markEntityAsSynced)
const toClusterInputFromEntityMock = vi.mocked(toClusterInputFromEntity)
const updateRemoteEntityMock = vi.mocked(updateRemoteEntity)

const atlasClient = makeAtlasClient().client
const logger = makeLogger().logger
const tx = makeDb()
const transaction = vi.fn(async (callback: (transactionDb: DB) => unknown) => callback(tx))
const db = { transaction } as unknown as DB
const input = makeAtlasInput()

const callForcePushEntity = (id = 'entity-1') =>
  forcePushEntity({ id, db, logger, dependencies: { atlasClient } })

describe('forcePushEntity', () => {
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
    toClusterInputFromEntityMock.mockReturnValue(input)
  })

  it('forces the local version to ATLAS and marks the entity as synced', async () => {
    const cluster = makeAtlasCluster({ atlasId: 'atlas-1' })
    updateRemoteEntityMock.mockResolvedValue({ code: 'updated', cluster })

    await expect(callForcePushEntity()).resolves.toEqual({
      success: true,
      data: {
        code: 'synced',
        entityId: 'entity-1',
        atlasId: 'atlas-1',
      },
    })

    expect(updateRemoteEntityMock).toHaveBeenCalledWith({
      atlasId: 'atlas-1',
      input,
      lastSyncedAt: null,
      conflictPolicy: 'overwrite',
      atlasClient,
    })
    expect(markEntityAsPendingPushMock).toHaveBeenCalledOnce()
    expect(markEntityAsPendingPushMock.mock.calls[0]?.slice(0, 2)).toEqual(['entity-1', tx])
    expect(markEntityAsSyncedMock).toHaveBeenCalledOnce()
    expect(markEntityAsSyncedMock.mock.calls[0]?.slice(0, 3)).toEqual(['entity-1', 'atlas-1', tx])
  })

  it('returns not linked without writing when the entity has no atlas id', async () => {
    getEntityMock.mockResolvedValue({
      success: true,
      data: makeEntity({ atlasId: null, syncStatus: 'failed', syncCode: 'conflict' }),
    })

    await expect(callForcePushEntity()).resolves.toEqual({
      success: true,
      data: { code: 'not_linked', entityId: 'entity-1' },
    })

    expect(updateRemoteEntityMock).not.toHaveBeenCalled()
  })

  it('does not force an entity that is not in conflict', async () => {
    getEntityMock.mockResolvedValue({
      success: true,
      data: makeEntity({ atlasId: 'atlas-1', syncStatus: 'pending_push', syncCode: null }),
    })

    await expect(callForcePushEntity()).resolves.toEqual({
      success: true,
      data: { code: 'no_conflict', entityId: 'entity-1' },
    })

    expect(updateRemoteEntityMock).not.toHaveBeenCalled()
  })

  it('records a confirmed missing remote entity', async () => {
    updateRemoteEntityMock.mockResolvedValue({ code: 'not_found', atlasId: 'atlas-1' })

    await expect(callForcePushEntity()).resolves.toEqual({
      success: true,
      data: {
        code: 'remote_not_found',
        entityId: 'entity-1',
        atlasId: 'atlas-1',
      },
    })

    expect(markEntityAsNotFoundMock).toHaveBeenCalledOnce()
    expect(markEntityAsNotFoundMock.mock.calls[0]?.slice(0, 2)).toEqual(['entity-1', tx])
    expect(markEntityAsSyncedMock).not.toHaveBeenCalled()
  })

  it('marks synchronization as failed when the forced update fails', async () => {
    const error = new Error('ATLAS unavailable')
    updateRemoteEntityMock.mockRejectedValue(error)

    await expect(callForcePushEntity()).resolves.toEqual({
      success: false,
      code: 'external',
      message: 'Unable to force push entity entity-1 to ATLAS.',
      error,
    })

    expect(markEntityAsFailedSyncMock).toHaveBeenCalledOnce()
    expect(markEntityAsFailedSyncMock.mock.calls[0]?.[0]).toBe('entity-1')
  })
})
