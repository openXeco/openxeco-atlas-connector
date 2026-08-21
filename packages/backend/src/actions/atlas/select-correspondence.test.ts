import { beforeEach, describe, expect, it, vi } from 'vitest'

import { selectCorrespondence } from '@/actions/atlas/select-correspondence.js'
import { updateRemoteEntity } from '@/actions/atlas/internal/update-remote-entity.js'
import { toClusterInputFromEntity } from '@/actions/atlas/utils/transformers.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import { isAtlasIdLinkedToEntity, markEntityAsSynced } from '@/actions/entities/common.js'
import { makeAtlasClient, makeLogger } from '@/actions/atlas/test-support/fakes.js'
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
  isAtlasIdLinkedToEntity: vi.fn(),
  markEntityAsSynced: vi.fn(),
}))

const getEntityMock = vi.mocked(getEntity)
const isAtlasIdLinkedToEntityMock = vi.mocked(isAtlasIdLinkedToEntity)
const markEntityAsSyncedMock = vi.mocked(markEntityAsSynced)
const toClusterInputFromEntityMock = vi.mocked(toClusterInputFromEntity)
const updateRemoteEntityMock = vi.mocked(updateRemoteEntity)

const atlasClient = makeAtlasClient().client
const logger = makeLogger().logger
const entity = makeEntity({ atlasId: 'atlas-missing' })
const input = makeAtlasInput()
const where = vi.fn().mockResolvedValue(undefined)
const set = vi.fn(() => ({ where }))
const update = vi.fn(() => ({ set }))
const db = { update } as unknown as DB

const callSelectCorrespondence = (id: string | undefined = 'entity-1') =>
  selectCorrespondence({
    id,
    data: { atlasId: 'atlas-candidate' },
    db,
    logger,
    dependencies: { atlasClient },
  })

describe('selectCorrespondence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getEntityMock.mockResolvedValue({ success: true, data: entity })
    isAtlasIdLinkedToEntityMock.mockResolvedValue(false)
    toClusterInputFromEntityMock.mockReturnValue(input)
  })

  it('rejects a request without a local entity id', async () => {
    await expect(
      selectCorrespondence({
        data: { atlasId: 'atlas-candidate' },
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

    await expect(callSelectCorrespondence()).resolves.toEqual({
      success: false,
      code: 'notFound',
      message: 'Entity with id entity-1 was not found.',
    })

    expect(updateRemoteEntityMock).not.toHaveBeenCalled()
  })

  it('does not select a candidate already linked to a local entity', async () => {
    isAtlasIdLinkedToEntityMock.mockResolvedValue(true)

    await expect(callSelectCorrespondence()).resolves.toEqual({
      success: true,
      data: {
        code: 'already_linked',
        entityId: 'entity-1',
        atlasId: 'atlas-candidate',
      },
    })

    expect(updateRemoteEntityMock).not.toHaveBeenCalled()
    expect(markEntityAsSyncedMock).not.toHaveBeenCalled()
  })

  it('reports a candidate that disappeared before selection without changing the link', async () => {
    updateRemoteEntityMock.mockResolvedValue({
      code: 'not_found',
      atlasId: 'atlas-candidate',
    })

    await expect(callSelectCorrespondence()).resolves.toEqual({
      success: true,
      data: {
        code: 'candidate_not_found',
        entityId: 'entity-1',
        atlasId: 'atlas-candidate',
      },
    })

    expect(update).not.toHaveBeenCalled()
    expect(markEntityAsSyncedMock).not.toHaveBeenCalled()
  })

  it('links the selected candidate and records conflicting fields without updating ATLAS', async () => {
    const conflictFields = ['name', 'website']
    updateRemoteEntityMock.mockResolvedValue({
      code: 'conflict',
      atlasId: 'atlas-candidate',
      conflictFields,
    })

    await expect(callSelectCorrespondence()).resolves.toEqual({
      success: true,
      data: {
        code: 'conflict',
        entityId: 'entity-1',
        atlasId: 'atlas-candidate',
        conflictFields,
      },
    })

    expect(set).toHaveBeenCalledWith({
      atlasId: 'atlas-candidate',
      lastSyncedAt: null,
      syncStatus: 'failed',
      syncCode: 'conflict',
      updatedAt: expect.any(Date),
    })
    expect(markEntityAsSyncedMock).not.toHaveBeenCalled()
  })

  it('uses a fresh synchronization baseline for the selected candidate', async () => {
    const cluster = makeAtlasCluster({ atlasId: 'atlas-candidate' })
    updateRemoteEntityMock.mockResolvedValue({ code: 'updated', cluster })

    await callSelectCorrespondence()

    expect(updateRemoteEntityMock).toHaveBeenCalledWith({
      atlasId: 'atlas-candidate',
      input,
      lastSyncedAt: null,
      atlasClient,
    })
  })

  it('marks the local entity as synced after successfully reconciling the candidate', async () => {
    const cluster = makeAtlasCluster({ atlasId: 'atlas-candidate' })
    updateRemoteEntityMock.mockResolvedValue({ code: 'updated', cluster })

    await expect(callSelectCorrespondence()).resolves.toEqual({
      success: true,
      data: {
        code: 'synced',
        entityId: 'entity-1',
        atlasId: 'atlas-candidate',
      },
    })

    expect(markEntityAsSyncedMock).toHaveBeenCalledOnce()
    expect(markEntityAsSyncedMock.mock.calls[0]?.slice(0, 2)).toEqual(['entity-1', 'atlas-candidate'])
  })
})
