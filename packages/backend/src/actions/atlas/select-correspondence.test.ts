import { beforeEach, describe, expect, it, vi } from 'vitest'

import { selectCorrespondence } from '@/actions/atlas/select-correspondence.js'
import { getClusterByID } from '@/actions/atlas/utils/atlas-clusters.js'
import { AtlasApiError } from '@/actions/atlas/utils/atlas-api-error.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import { isAtlasIdLinkedToEntity } from '@/actions/entities/common.js'
import { makeAtlasClient, makeLogger } from '@/actions/atlas/test-support/fakes.js'
import { makeAtlasCluster, makeEntity } from '@/actions/atlas/test-support/fixtures.js'
import type { DB } from '@/types.js'

vi.mock('@/actions/atlas/utils/atlas-clusters.js', () => ({
  getClusterByID: vi.fn(),
}))

vi.mock('@/actions/entities/get-entity.js', () => ({
  getEntity: vi.fn(),
}))

vi.mock('@/actions/entities/common.js', () => ({
  isAtlasIdLinkedToEntity: vi.fn(),
}))

const getClusterByIDMock = vi.mocked(getClusterByID)
const getEntityMock = vi.mocked(getEntity)
const isAtlasIdLinkedToEntityMock = vi.mocked(isAtlasIdLinkedToEntity)

const atlasClient = makeAtlasClient().client
const logger = makeLogger().logger
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
    getEntityMock.mockResolvedValue({
      success: true,
      data: makeEntity({ atlasId: 'atlas-missing' }),
    })
    isAtlasIdLinkedToEntityMock.mockResolvedValue(false)
    getClusterByIDMock.mockResolvedValue(makeAtlasCluster({ atlasId: 'atlas-candidate' }))
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

    expect(getClusterByIDMock).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })

  it('rejects a candidate already linked to a local entity', async () => {
    isAtlasIdLinkedToEntityMock.mockResolvedValue(true)

    await expect(callSelectCorrespondence()).resolves.toEqual({
      success: false,
      code: 'validation',
      message: 'Entity with atlasId atlas-candidate was already linked.',
    })

    expect(getClusterByIDMock).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })

  it('rejects a candidate that disappeared before selection', async () => {
    getClusterByIDMock.mockRejectedValue(new AtlasApiError('Not found', 404))

    await expect(callSelectCorrespondence()).resolves.toEqual({
      success: false,
      code: 'notFound',
      message: 'Remote entity atlas-candidate not found.',
    })

    expect(update).not.toHaveBeenCalled()
  })

  it('does not link a candidate when ATLAS verification fails', async () => {
    getClusterByIDMock.mockRejectedValue(new AtlasApiError('Unavailable', 503))

    await expect(callSelectCorrespondence()).resolves.toEqual({
      success: false,
      code: 'external',
      message: 'Error occurred. Unavailable',
    })

    expect(update).not.toHaveBeenCalled()
  })

  it('links the selected candidate and leaves it pending for the next push', async () => {
    await expect(callSelectCorrespondence()).resolves.toEqual({
      success: true,
      data: {
        code: 'selected',
        entityId: 'entity-1',
        atlasId: 'atlas-candidate',
      },
    })

    expect(getClusterByIDMock).toHaveBeenCalledWith('atlas-candidate', atlasClient)
    expect(set).toHaveBeenCalledWith({
      atlasId: 'atlas-candidate',
      syncStatus: 'pending_push',
      syncCode: null,
      updatedAt: expect.any(Date),
      lastSyncedAt: null,
    })
  })

  it('returns an unexpected failure when the local link cannot be saved', async () => {
    const error = new Error('Database unavailable')
    where.mockRejectedValueOnce(error)

    await expect(callSelectCorrespondence()).resolves.toEqual({
      success: false,
      code: 'unexpected',
      message: 'Unexpected error when selecting correspondence. Database unavailable',
    })
  })
})
