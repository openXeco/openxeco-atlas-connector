import { beforeEach, describe, expect, it, vi } from 'vitest'

import { pushEntity } from '@/actions/atlas/push-entity.js'
import { updateRemoteEntity } from '@/actions/atlas/internal/update-remote-entity.js'
import { createRemoteEntity } from '@/actions/atlas/internal/create-remote-entity.js'
import { findCorrespondences } from '@/actions/atlas/internal/find-correspondences.js'
import { toClusterInputFromEntity } from '@/actions/atlas/utils/transformers.js'
import { canEntityBePushed } from '@/actions/entities/common.js'
import {
  finalizeEntitySyncConflict,
  finalizeEntitySyncFailure,
  finalizeEntitySyncSuccess,
} from '@/actions/atlas/internal/finalize-entity-sync.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import { makeAtlasClient, makeDb, makeLogger } from '@/actions/atlas/test-support/fakes.js'
import { makeAtlasCluster, makeAtlasInput, makeEntity } from '@/actions/atlas/test-support/fixtures.js'

vi.mock('@/actions/atlas/internal/update-remote-entity.js', () => ({
  updateRemoteEntity: vi.fn(),
}))

vi.mock('@/actions/atlas/internal/create-remote-entity.js', () => ({
  createRemoteEntity: vi.fn(),
}))

vi.mock('@/actions/atlas/internal/find-correspondences.js', () => ({
  findCorrespondences: vi.fn(),
}))

vi.mock('@/actions/atlas/utils/transformers.js', () => ({
  toClusterInputFromEntity: vi.fn(),
}))

vi.mock('@/actions/entities/get-entity.js', () => ({
  getEntity: vi.fn(),
}))

vi.mock('@/actions/entities/common.js', () => ({
  canEntityBePushed: vi.fn(),
}))

vi.mock('@/actions/atlas/internal/finalize-entity-sync.js', () => ({
  finalizeEntitySyncConflict: vi.fn(),
  finalizeEntitySyncFailure: vi.fn(),
  finalizeEntitySyncSuccess: vi.fn(),
}))

const getEntityMock = vi.mocked(getEntity)
const canEntityBePushedMock = vi.mocked(canEntityBePushed)
const updateRemoteEntityMock = vi.mocked(updateRemoteEntity)
const createRemoteEntityMock = vi.mocked(createRemoteEntity)
const findCorrespondencesMock = vi.mocked(findCorrespondences)
const toClusterInputFromEntityMock = vi.mocked(toClusterInputFromEntity)
const finalizeEntitySyncConflictMock = vi.mocked(finalizeEntitySyncConflict)
const finalizeEntitySyncFailureMock = vi.mocked(finalizeEntitySyncFailure)
const finalizeEntitySyncSuccessMock = vi.mocked(finalizeEntitySyncSuccess)

const db = makeDb()
const atlasClient = makeAtlasClient().client
const logger = makeLogger().logger
const localInput = makeAtlasInput({ registrationNumber: undefined })

const setupEntity = (overrides: Parameters<typeof makeEntity>[0] = {}) => {
  const entity = makeEntity(overrides)
  getEntityMock.mockResolvedValue({ success: true, data: entity })
  return entity
}

const callPushEntity = (id = 'entity-1') =>
  pushEntity({
    id,
    db,
    logger,
    dependencies: { atlasClient },
  })

describe('pushEntity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    canEntityBePushedMock.mockReturnValue(true)
    toClusterInputFromEntityMock.mockReturnValue(localInput)
  })

  it('rejects a request without an entity id', async () => {
    const result = await pushEntity({
      db,
      logger,
      dependencies: { atlasClient },
    })

    expect(result).toEqual({
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

    const result = await callPushEntity()

    expect(result).toEqual({
      success: false,
      code: 'notFound',
      message: 'Entity with id entity-1 was not found.',
    })
    expect(updateRemoteEntityMock).not.toHaveBeenCalled()
    expect(createRemoteEntityMock).not.toHaveBeenCalled()
  })

  it('rejects an entity that is not pending push', async () => {
    setupEntity({ syncStatus: 'synced' })
    canEntityBePushedMock.mockReturnValue(false)

    const result = await callPushEntity()

    expect(result).toMatchObject({
      success: false,
      code: 'validation',
    })
    expect(updateRemoteEntityMock).not.toHaveBeenCalled()
    expect(createRemoteEntityMock).not.toHaveBeenCalled()
  })

  it('updates a linked entity and marks it as synced', async () => {
    const entity = setupEntity({
      atlasId: 'atlas-existing',
      lastSyncedAt: new Date('2026-08-01T10:00:00Z'),
    })
    const cluster = makeAtlasCluster({ atlasId: 'atlas-existing' })
    updateRemoteEntityMock.mockResolvedValue({ code: 'updated', cluster })

    const result = await callPushEntity()

    expect(updateRemoteEntityMock).toHaveBeenCalledWith({
      atlasId: 'atlas-existing',
      atlasClient,
      lastSyncedAt: entity.lastSyncedAt,
      input: localInput,
    })
    expect(finalizeEntitySyncSuccessMock).toHaveBeenCalledWith('update', 'entity-1', 'atlas-existing', db, logger)
    expect(result).toEqual({
      success: true,
      data: {
        code: 'synced',
        operation: 'updated',
        entityId: 'entity-1',
        atlasId: 'atlas-existing',
      },
    })
    expect(findCorrespondencesMock).not.toHaveBeenCalled()
    expect(createRemoteEntityMock).not.toHaveBeenCalled()
  })

  it('records a conflict and does not write to ATLAS', async () => {
    setupEntity({ atlasId: 'atlas-existing' })
    const conflictFields = ['name', 'website']
    updateRemoteEntityMock.mockResolvedValue({
      code: 'conflict',
      atlasId: 'atlas-existing',
      conflictFields,
      remote: makeAtlasCluster({ atlasId: 'atlas-existing' }),
    })

    const result = await callPushEntity()

    expect(finalizeEntitySyncConflictMock).toHaveBeenCalledWith(
      'update',
      'entity-1',
      'atlas-existing',
      conflictFields,
      db,
      logger,
    )
    expect(result).toMatchObject({
      success: false,
      code: 'conflict',
    })
    expect(findCorrespondencesMock).not.toHaveBeenCalled()
    expect(createRemoteEntityMock).not.toHaveBeenCalled()
  })

  it('restarts discovery after a stored atlas id is not found', async () => {
    setupEntity({
      atlasId: 'atlas-missing',
      registrationNumber: '  LU-123  ',
    })
    const candidate = makeAtlasCluster({ atlasId: 'atlas-candidate' })
    updateRemoteEntityMock.mockResolvedValue({
      code: 'not_found',
      atlasId: 'atlas-missing',
    })
    findCorrespondencesMock.mockResolvedValue([candidate])

    const result = await callPushEntity()

    expect(findCorrespondencesMock).toHaveBeenCalledWith('LU-123', atlasClient, db)
    expect(result).toEqual({
      success: true,
      data: {
        code: 'selection_required',
        candidates: [candidate],
        entityId: 'entity-1',
      },
    })
    expect(finalizeEntitySyncSuccessMock).not.toHaveBeenCalled()
    expect(finalizeEntitySyncFailureMock).not.toHaveBeenCalled()
  })

  it('creates automatically when the registration number is absent', async () => {
    setupEntity({ registrationNumber: '   ' })
    const cluster = makeAtlasCluster({ atlasId: 'atlas-created' })
    createRemoteEntityMock.mockResolvedValue(cluster)

    const result = await callPushEntity()

    expect(findCorrespondencesMock).not.toHaveBeenCalled()
    expect(createRemoteEntityMock).toHaveBeenCalledWith({ input: localInput, atlasClient })
    expect(finalizeEntitySyncSuccessMock).toHaveBeenCalledWith('create', 'entity-1', 'atlas-created', db, logger)
    expect(result).toEqual({
      success: true,
      data: {
        code: 'synced',
        operation: 'created',
        entityId: 'entity-1',
        atlasId: 'atlas-created',
      },
    })
  })

  it('creates automatically after a successful search finds no candidates', async () => {
    setupEntity({ registrationNumber: 'LU-123' })
    const cluster = makeAtlasCluster({ atlasId: 'atlas-created' })
    findCorrespondencesMock.mockResolvedValue([])
    createRemoteEntityMock.mockResolvedValue(cluster)

    const result = await callPushEntity()

    expect(findCorrespondencesMock).toHaveBeenCalledWith('LU-123', atlasClient, db)
    expect(finalizeEntitySyncSuccessMock).toHaveBeenCalledWith('create', 'entity-1', 'atlas-created', db, logger)
    expect(result).toMatchObject({
      success: true,
      data: {
        code: 'synced',
        operation: 'created',
      },
    })
  })

  it('returns candidates without changing local synchronization state', async () => {
    setupEntity({ registrationNumber: 'LU-123' })
    const candidates = [makeAtlasCluster({ atlasId: 'atlas-1' }), makeAtlasCluster({ atlasId: 'atlas-2' })]
    findCorrespondencesMock.mockResolvedValue(candidates)

    const result = await callPushEntity()

    expect(result).toEqual({
      success: true,
      data: {
        code: 'selection_required',
        candidates,
        entityId: 'entity-1',
      },
    })
    expect(createRemoteEntityMock).not.toHaveBeenCalled()
    expect(finalizeEntitySyncSuccessMock).not.toHaveBeenCalled()
    expect(finalizeEntitySyncConflictMock).not.toHaveBeenCalled()
    expect(finalizeEntitySyncFailureMock).not.toHaveBeenCalled()
  })

  it('does not change synchronization state when candidate discovery fails', async () => {
    setupEntity({ registrationNumber: 'LU-123' })
    const error = new Error('ATLAS search failed')
    findCorrespondencesMock.mockRejectedValue(error)

    const result = await callPushEntity()

    expect(result).toMatchObject({
      success: false,
      error,
    })
    expect(createRemoteEntityMock).not.toHaveBeenCalled()
    expect(finalizeEntitySyncSuccessMock).not.toHaveBeenCalled()
    expect(finalizeEntitySyncConflictMock).not.toHaveBeenCalled()
    expect(finalizeEntitySyncFailureMock).not.toHaveBeenCalled()
  })

  it('marks the entity as failed when creation fails', async () => {
    setupEntity()
    const error = new Error('ATLAS creation failed')
    createRemoteEntityMock.mockRejectedValue(error)

    const result = await callPushEntity()

    expect(finalizeEntitySyncFailureMock).toHaveBeenCalledWith('create', 'failed', 'entity-1', undefined, db, logger)
    expect(result).toEqual({
      success: false,
      code: 'unexpected',
      message: 'Unable to push the entity entity-1',
      error,
    })
  })

  it('returns an unexpected failure when updating ATLAS fails', async () => {
    setupEntity({ atlasId: 'atlas-existing' })
    const error = new Error('ATLAS update failed')
    updateRemoteEntityMock.mockRejectedValue(error)

    const result = await callPushEntity()

    expect(finalizeEntitySyncFailureMock).not.toHaveBeenCalled()
    expect(result).toEqual({
      success: false,
      code: 'unexpected',
      message: 'ATLAS update failed',
    })
  })
})
