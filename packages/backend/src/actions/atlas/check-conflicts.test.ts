import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkConflicts } from '@/actions/atlas/check-conflicts.js'
import { makeAtlasClient, makeLogger } from '@/actions/atlas/test-support/fakes.js'
import { makeAtlasCluster, makeEntity, makeTaxonomy } from '@/actions/atlas/test-support/fixtures.js'
import { AtlasApiError } from '@/actions/atlas/utils/atlas-api-error.js'
import { getClusterByID } from '@/actions/atlas/utils/atlas-clusters.js'
import type { DB } from '@/types.js'
import { getEntity } from '@/actions/entities/get-entity.js'

vi.mock('@/actions/atlas/utils/atlas-clusters.js', () => ({ getClusterByID: vi.fn() }))
vi.mock('@/actions/entities/get-entity.js', () => ({ getEntity: vi.fn() }))

const getEntityMock = vi.mocked(getEntity)
const getClusterByIDMock = vi.mocked(getClusterByID)
const atlas = makeAtlasClient()
const where = vi.fn()
const from = vi.fn(() => ({ where }))
const select = vi.fn(() => ({ from }))
const db = { select } as unknown as DB
const logger = makeLogger().logger
const callCheckConflicts = (id = 'entity-1') =>
  checkConflicts({ id, db, logger, dependencies: { atlasClient: atlas.client } })

describe('checkConflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    where.mockResolvedValue([{ atlasId: 'sector-2', name: 'Cybersecurity' }])
    getEntityMock.mockResolvedValue({
      success: true,
      data: makeEntity({
        atlasId: 'atlas-1',
        name: 'Local entity',
        countryCode: 'LU',
        syncStatus: 'failed',
        syncCode: 'conflict',
      }),
    })
  })

  it('fetches fresh remote values and returns only fields that still conflict', async () => {
    getClusterByIDMock
      .mockResolvedValueOnce(makeAtlasCluster())
      .mockResolvedValueOnce(makeAtlasCluster({ name: 'Local entity', city: 'Luxembourg' }))

    await expect(callCheckConflicts()).resolves.toEqual({ success: true, data: { name: 'Remote entity' } })
    await expect(callCheckConflicts()).resolves.toEqual({ success: true, data: { city: 'Luxembourg' } })

    expect(getClusterByIDMock).toHaveBeenCalledTimes(2)
    expect(getClusterByIDMock).toHaveBeenCalledWith('atlas-1', atlas.client)
    expect(atlas.patch).not.toHaveBeenCalled()
    expect(atlas.post).not.toHaveBeenCalled()
    expect(atlas.put).not.toHaveBeenCalled()
  })

  it('returns an empty object when normalized values and taxonomy memberships match', async () => {
    getEntityMock.mockResolvedValue({
      success: true,
      data: makeEntity({
        atlasId: 'atlas-1',
        name: 'Local entity',
        countryCode: 'LU',
        registrationNumber: ' LU-123 ',
        sectors: [makeTaxonomy({ atlasId: 'sector-1' }), makeTaxonomy({ atlasId: 'sector-2' })],
      }),
    })
    getClusterByIDMock.mockResolvedValue(
      makeAtlasCluster({ name: 'Local entity', registrationNumber: 'LU-123', sectorIds: ['sector-2', 'sector-1'] }),
    )

    await expect(callCheckConflicts()).resolves.toEqual({ success: true, data: {} })
  })

  it('preserves cleared fields, false booleans and taxonomy values in JSON', async () => {
    getEntityMock.mockResolvedValue({
      success: true,
      data: makeEntity({
        atlasId: 'atlas-1',
        name: 'Local entity',
        countryCode: 'LU',
        email: 'local@example.com',
        isHeadquarter: true,
        sectors: [makeTaxonomy({ atlasId: 'sector-1' })],
      }),
    })
    getClusterByIDMock.mockResolvedValue(
      makeAtlasCluster({ name: 'Local entity', isHeadquarter: false, sectorIds: ['sector-2'] }),
    )

    const result = await callCheckConflicts()
    expect(JSON.parse(JSON.stringify(result))).toEqual({
      success: true,
      data: { email: null, isHeadquarter: false, sectorIds: ['Cybersecurity'] },
    })
  })

  it('returns names for every taxonomy type, including terms not selected locally', async () => {
    const fields = [
      'clusterTypeId',
      'thematicAreaIds',
      'sectorIds',
      'technologyIds',
      'useCaseIds',
      'fieldsOfActivityIds',
    ] as const
    where.mockResolvedValue(fields.map((field) => ({ atlasId: field, name: `Name for ${field}` })))
    getClusterByIDMock.mockResolvedValue(
      makeAtlasCluster({
        name: 'Local entity',
        clusterTypeId: 'clusterTypeId',
        thematicAreaIds: ['thematicAreaIds'],
        sectorIds: ['sectorIds'],
        technologyIds: ['technologyIds'],
        useCaseIds: ['useCaseIds'],
        fieldsOfActivityIds: ['fieldsOfActivityIds'],
      }),
    )

    await expect(callCheckConflicts()).resolves.toEqual({
      success: true,
      data: Object.fromEntries(
        fields.map((field) => [field, field === 'clusterTypeId' ? `Name for ${field}` : [`Name for ${field}`]]),
      ),
    })
    expect(select).toHaveBeenCalledTimes(1)
    expect(atlas.get).not.toHaveBeenCalled()
  })

  it('preserves cleared taxonomy values without looking up names', async () => {
    getEntityMock.mockResolvedValue({
      success: true,
      data: makeEntity({
        name: 'Local entity',
        atlasId: 'atlas-1',
        countryCode: 'LU',
        clusterType: makeTaxonomy(),
        sectors: [makeTaxonomy()],
      }),
    })
    getClusterByIDMock.mockResolvedValue(makeAtlasCluster({ name: 'Local entity', sectorIds: [] }))
    await expect(callCheckConflicts()).resolves.toEqual({ success: true, data: { clusterTypeId: null, sectorIds: [] } })
    expect(select).not.toHaveBeenCalled()
  })

  it('requires a local entity id', async () => {
    await expect(callCheckConflicts('')).resolves.toMatchObject({ success: false, code: 'validation' })
    expect(getEntityMock).not.toHaveBeenCalled()
    expect(getClusterByIDMock).not.toHaveBeenCalled()
  })

  it.each(['notFound', 'unexpected'] as const)('preserves local lookup errors (%s)', async (code) => {
    const failure = { success: false as const, code, message: 'Local lookup failed.' }
    getEntityMock.mockResolvedValue(failure)

    await expect(callCheckConflicts()).resolves.toEqual(failure)
    expect(getClusterByIDMock).not.toHaveBeenCalled()
  })

  it('requires a linked remote entity', async () => {
    getEntityMock.mockResolvedValue({ success: true, data: makeEntity({ atlasId: null }) })

    await expect(callCheckConflicts()).resolves.toMatchObject({ success: false, code: 'validation' })
    expect(getClusterByIDMock).not.toHaveBeenCalled()
  })

  it.each([
    [404, 'notFound'],
    [503, 'external'],
  ] as const)('handles remote HTTP %s errors', async (status, code) => {
    getClusterByIDMock.mockRejectedValue(new AtlasApiError('Remote request failed', status))

    await expect(callCheckConflicts()).resolves.toMatchObject({ success: false, code })
  })
})
