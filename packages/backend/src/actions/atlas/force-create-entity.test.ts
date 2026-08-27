import { beforeEach, describe, expect, it, vi } from 'vitest'

import { forceCreateEntity } from '@/actions/atlas/force-create-entity.js'
import { createRemoteEntity } from '@/actions/atlas/internal/create-remote-entity.js'
import { getClusterByID } from '@/actions/atlas/utils/atlas-clusters.js'
import { AtlasApiError } from '@/actions/atlas/utils/atlas-api-error.js'
import { toClusterInputFromEntity } from '@/actions/atlas/utils/transformers.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import { canEntityBePushed, markEntityAsPendingPush } from '@/actions/entities/common.js'
import { createSyncLog } from '@/actions/atlas/internal/create-sync-log.js'
import { finalizeEntitySyncFailure, finalizeEntitySyncSuccess } from '@/actions/atlas/internal/finalize-entity-sync.js'
import { makeAtlasClient, makeDb, makeLogger } from '@/actions/atlas/test-support/fakes.js'
import { makeAtlasCluster, makeAtlasInput, makeEntity } from '@/actions/atlas/test-support/fixtures.js'

vi.mock('@/actions/atlas/internal/create-remote-entity.js', () => ({
  createRemoteEntity: vi.fn(),
}))

vi.mock('@/actions/atlas/utils/atlas-clusters.js', () => ({
  getClusterByID: vi.fn(),
}))

vi.mock('@/actions/atlas/utils/transformers.js', () => ({
  toClusterInputFromEntity: vi.fn(),
}))

vi.mock('@/actions/entities/get-entity.js', () => ({
  getEntity: vi.fn(),
}))

vi.mock('@/actions/entities/common.js', () => ({
  canEntityBePushed: vi.fn(),
  markEntityAsPendingPush: vi.fn(),
}))

vi.mock('@/actions/atlas/internal/create-sync-log.js', () => ({
  createSyncLog: vi.fn(),
}))

vi.mock('@/actions/atlas/internal/finalize-entity-sync.js', () => ({
  finalizeEntitySyncFailure: vi.fn(),
  finalizeEntitySyncSuccess: vi.fn(),
}))

const canEntityBePushedMock = vi.mocked(canEntityBePushed)
const createRemoteEntityMock = vi.mocked(createRemoteEntity)
const createSyncLogMock = vi.mocked(createSyncLog)
const finalizeEntitySyncFailureMock = vi.mocked(finalizeEntitySyncFailure)
const finalizeEntitySyncSuccessMock = vi.mocked(finalizeEntitySyncSuccess)
const getClusterByIDMock = vi.mocked(getClusterByID)
const getEntityMock = vi.mocked(getEntity)
const markEntityAsPendingPushMock = vi.mocked(markEntityAsPendingPush)
const toClusterInputFromEntityMock = vi.mocked(toClusterInputFromEntity)

const atlasClient = makeAtlasClient().client
const db = makeDb()
const logger = makeLogger().logger
const input = makeAtlasInput()

const callForceCreateEntity = (id = 'entity-1') =>
  forceCreateEntity({
    id,
    db,
    logger,
    dependencies: { atlasClient },
  })

describe('forceCreateEntity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getEntityMock.mockResolvedValue({ success: true, data: makeEntity() })
    canEntityBePushedMock.mockReturnValue(true)
    toClusterInputFromEntityMock.mockReturnValue(input)
  })

  it('creates and links a new ATLAS entity without searching for correspondences', async () => {
    const cluster = makeAtlasCluster({ atlasId: 'atlas-created' })
    createRemoteEntityMock.mockResolvedValue(cluster)

    await expect(callForceCreateEntity()).resolves.toEqual({
      success: true,
      data: {
        code: 'synced',
        operation: 'created',
        entityId: 'entity-1',
        atlasId: 'atlas-created',
      },
    })

    expect(getClusterByIDMock).not.toHaveBeenCalled()
    expect(createRemoteEntityMock).toHaveBeenCalledWith({ input, atlasClient })
    expect(markEntityAsPendingPushMock).toHaveBeenCalledOnce()
    expect(markEntityAsPendingPushMock.mock.calls[0]?.[0]).toBe('entity-1')
    expect(finalizeEntitySyncSuccessMock).toHaveBeenCalledWith('force-create', 'entity-1', 'atlas-created', db, logger)
  })

  it('rejects a request without a local entity id', async () => {
    await expect(
      forceCreateEntity({
        db,
        logger,
        dependencies: { atlasClient },
      }),
    ).resolves.toEqual({
      success: false,
      code: 'validation',
      message: 'Entity id is required.',
    })

    expect(getEntityMock).not.toHaveBeenCalled()
  })

  it('returns not found when the local entity does not exist', async () => {
    getEntityMock.mockResolvedValue({
      success: false,
      code: 'notFound',
      message: 'Entity not found.',
    })

    await expect(callForceCreateEntity()).resolves.toEqual({
      success: false,
      code: 'notFound',
      message: 'Entity with id entity-1 was not found.',
    })

    expect(createRemoteEntityMock).not.toHaveBeenCalled()
  })

  it('rejects an entity that is not eligible for pushing', async () => {
    getEntityMock.mockResolvedValue({ success: true, data: makeEntity({ syncStatus: 'synced' }) })
    canEntityBePushedMock.mockReturnValue(false)

    await expect(callForceCreateEntity()).resolves.toMatchObject({
      success: false,
      code: 'validation',
    })

    expect(createRemoteEntityMock).not.toHaveBeenCalled()
  })

  it('does not create when the existing linked ATLAS entity still exists', async () => {
    getEntityMock.mockResolvedValue({
      success: true,
      data: makeEntity({ atlasId: 'atlas-existing' }),
    })
    getClusterByIDMock.mockResolvedValue(makeAtlasCluster({ atlasId: 'atlas-existing' }))

    await expect(callForceCreateEntity()).resolves.toEqual({
      success: false,
      code: 'validation',
      message: 'The entity entity-1 is already linked to atlas-existing.',
    })

    expect(createSyncLogMock).toHaveBeenCalledOnce()
    expect(createRemoteEntityMock).not.toHaveBeenCalled()
    expect(markEntityAsPendingPushMock).not.toHaveBeenCalled()
  })

  it('creates when the stored atlas id is confirmed missing', async () => {
    getEntityMock.mockResolvedValue({
      success: true,
      data: makeEntity({ atlasId: 'atlas-missing' }),
    })
    getClusterByIDMock.mockRejectedValue(new AtlasApiError('Not found', 404))
    createRemoteEntityMock.mockResolvedValue(makeAtlasCluster({ atlasId: 'atlas-created' }))

    await expect(callForceCreateEntity()).resolves.toMatchObject({
      success: true,
      data: {
        code: 'synced',
        atlasId: 'atlas-created',
      },
    })

    expect(createRemoteEntityMock).toHaveBeenCalledOnce()
  })

  it('does not create when the existing link cannot be verified', async () => {
    const error = new AtlasApiError('Unavailable', 503)
    getEntityMock.mockResolvedValue({
      success: true,
      data: makeEntity({ atlasId: 'atlas-existing' }),
    })
    getClusterByIDMock.mockRejectedValue(error)

    await expect(callForceCreateEntity()).resolves.toEqual({
      success: false,
      code: 'external',
      message: 'Could not verify the existing ATLAS entity.',
      error,
    })

    expect(createRemoteEntityMock).not.toHaveBeenCalled()
    expect(markEntityAsPendingPushMock).not.toHaveBeenCalled()
  })

  it('marks synchronization as failed when ATLAS creation fails', async () => {
    const error = new AtlasApiError('Unavailable', 503)
    createRemoteEntityMock.mockRejectedValue(error)

    await expect(callForceCreateEntity()).resolves.toEqual({
      success: false,
      code: 'unexpected',
      message: 'Unavailable',
    })

    expect(finalizeEntitySyncFailureMock).toHaveBeenCalledWith(
      'force-create',
      'failed',
      'entity-1',
      undefined,
      db,
      logger,
    )
    expect(finalizeEntitySyncSuccessMock).not.toHaveBeenCalled()
  })
})
