import { beforeEach, describe, expect, it, vi } from 'vitest'

import { forcePushEntity } from '@/actions/atlas/force-push-entity.js'
import { updateRemoteEntity } from '@/actions/atlas/internal/update-remote-entity.js'
import { toClusterInputFromEntity } from '@/actions/atlas/utils/transformers.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import { finalizeEntitySyncFailure, finalizeEntitySyncSuccess } from '@/actions/atlas/internal/finalize-entity-sync.js'
import { makeAtlasClient, makeDb, makeLogger } from '@/actions/atlas/test-support/fakes.js'
import { makeAtlasCluster, makeAtlasInput, makeEntity } from '@/actions/atlas/test-support/fixtures.js'

vi.mock('@/actions/atlas/internal/update-remote-entity.js', () => ({
  updateRemoteEntity: vi.fn(),
}))

vi.mock('@/actions/atlas/utils/transformers.js', () => ({
  toClusterInputFromEntity: vi.fn(),
}))

vi.mock('@/actions/entities/get-entity.js', () => ({
  getEntity: vi.fn(),
}))

vi.mock('@/actions/atlas/internal/finalize-entity-sync.js', () => ({
  finalizeEntitySyncFailure: vi.fn(),
  finalizeEntitySyncConflict: vi.fn(),
  finalizeEntitySyncSuccess: vi.fn(),
}))

const getEntityMock = vi.mocked(getEntity)
const finalizeEntitySyncFailureMock = vi.mocked(finalizeEntitySyncFailure)
const finalizeEntitySyncSuccessMock = vi.mocked(finalizeEntitySyncSuccess)
const toClusterInputFromEntityMock = vi.mocked(toClusterInputFromEntity)
const updateRemoteEntityMock = vi.mocked(updateRemoteEntity)

const atlasClient = makeAtlasClient().client
const logger = makeLogger().logger
const db = makeDb()
const input = makeAtlasInput()

const callForcePushEntity = (id = 'entity-1') => forcePushEntity({ id, db, logger, dependencies: { atlasClient } })

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
    expect(finalizeEntitySyncSuccessMock).toHaveBeenCalledWith('force-push', 'entity-1', 'atlas-1', db, logger)
  })

  it('returns not linked without writing when the entity has no atlas id', async () => {
    getEntityMock.mockResolvedValue({
      success: true,
      data: makeEntity({ atlasId: null, syncStatus: 'failed', syncCode: 'conflict' }),
    })

    await expect(callForcePushEntity()).resolves.toEqual({
      success: false,
      code: 'validation',
      message: 'The entity entity-1 is not linked with any ATLAS counterpart.',
    })

    expect(updateRemoteEntityMock).not.toHaveBeenCalled()
  })

  it('does not force an entity that is not in conflict', async () => {
    getEntityMock.mockResolvedValue({
      success: true,
      data: makeEntity({ atlasId: 'atlas-1', syncStatus: 'pending_push', syncCode: null }),
    })

    await expect(callForcePushEntity()).resolves.toEqual({
      success: false,
      code: 'validation',
      message: 'The entity entity-1 has not conflicts to resolve.',
    })

    expect(updateRemoteEntityMock).not.toHaveBeenCalled()
  })

  it('records a confirmed missing remote entity', async () => {
    updateRemoteEntityMock.mockResolvedValue({ code: 'not_found', atlasId: 'atlas-1' })

    await expect(callForcePushEntity()).resolves.toEqual({
      success: false,
      code: 'notFound',
      message: 'Remote entity not found.',
    })

    expect(finalizeEntitySyncFailureMock).toHaveBeenCalledWith(
      'force-push',
      'not_found',
      'entity-1',
      'atlas-1',
      db,
      logger,
    )
    expect(finalizeEntitySyncSuccessMock).not.toHaveBeenCalled()
  })

  it('preserves the conflict state when the forced update fails', async () => {
    const error = new Error('ATLAS unavailable')
    updateRemoteEntityMock.mockRejectedValue(error)

    await expect(callForcePushEntity()).resolves.toEqual({
      success: false,
      code: 'external',
      message: 'Unable to force push entity entity-1 to ATLAS.',
      error,
    })

    expect(finalizeEntitySyncFailureMock).not.toHaveBeenCalled()
    expect(finalizeEntitySyncSuccessMock).not.toHaveBeenCalled()
  })
})
