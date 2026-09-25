import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getClusterByID,
  getClustersByRegistrationCode,
  wasClusterRemotelyModified,
} from '@/actions/atlas/utils/atlas-clusters.js'
import { getSetting } from '@/actions/app/common.js'
import { SETTINGS_KEYS } from '@/config/constants.js'
import { makeAtlasClient, makeLogger } from '@/actions/atlas/test-support/fakes.js'
import { makeAtlasResource } from '@/actions/atlas/test-support/fixtures.js'
import type { DB } from '@/types.js'

vi.mock('@/actions/app/common.js', () => ({
  getSetting: vi.fn(),
}))

const getSettingMock = vi.mocked(getSetting)

describe('ATLAS cluster retrieval', () => {
  const atlas = makeAtlasClient()
  const logger = makeLogger()
  const limit = vi.fn()
  const where = vi.fn(() => ({ limit }))
  const from = vi.fn(() => ({ where }))
  const select = vi.fn(() => ({ from }))
  const db = { select } as unknown as DB

  beforeEach(() => {
    atlas.get.mockReset()
    getSettingMock.mockReset()
    logger.warn.mockReset()
    limit.mockReset()
    limit.mockResolvedValue([{ atlasId: 'atlas-country' }])
  })

  it('retrieves and maps a cluster by id', async () => {
    atlas.get.mockResolvedValue({ data: makeAtlasResource({ id: 'atlas-42' }) })

    await expect(getClusterByID('atlas-42', atlas.client)).resolves.toMatchObject({
      atlasId: 'atlas-42',
      name: 'Remote entity',
      countryCode: 'LU',
    })

    expect(atlas.get).toHaveBeenCalledWith('/node/cluster/atlas-42')
  })

  it('does not query configuration or ATLAS for a blank registration number', async () => {
    await expect(getClustersByRegistrationCode('   ', [], atlas.client, db, logger.logger)).resolves.toEqual([])

    expect(getSettingMock).not.toHaveBeenCalled()
    expect(atlas.get).not.toHaveBeenCalled()
  })

  it('filters by registration number and configured country and excludes locally linked entities', async () => {
    getSettingMock.mockResolvedValue('952767b0-22fe-4863-b7d0-aa16cfb76274')
    atlas.get.mockResolvedValue({
      data: [makeAtlasResource({ id: 'atlas-available' }), makeAtlasResource({ id: 'atlas-linked' })],
    })

    await expect(
      getClustersByRegistrationCode('LU-123', ['atlas-linked'], atlas.client, db, logger.logger),
    ).resolves.toEqual([expect.objectContaining({ atlasId: 'atlas-available' })])

    expect(getSettingMock).toHaveBeenCalledWith(SETTINGS_KEYS.COUNTRY, db)
    expect(atlas.get).toHaveBeenCalledWith('/node/cluster/', {
      filter: {
        registration_number: {
          path: 'field_registration_number',
          operator: '=',
          value: 'LU-123',
        },
        country_code: {
          path: 'field_country.id',
          operator: '=',
          value: 'atlas-country',
        },
      },
    })
  })

  it('returns an empty list when ATLAS has no matching data', async () => {
    getSettingMock.mockResolvedValue('LU')
    atlas.get.mockResolvedValue({})

    await expect(getClustersByRegistrationCode('LU-123', [], atlas.client, db, logger.logger)).resolves.toEqual([])
  })

  it('does not query ATLAS when the configured country is not available locally', async () => {
    getSettingMock.mockResolvedValue('missing-country')
    limit.mockResolvedValue([])

    await expect(getClustersByRegistrationCode('LU-123', [], atlas.client, db, logger.logger)).resolves.toEqual([])

    expect(logger.warn).toHaveBeenCalledWith('Country with id missing-country not found.')
    expect(atlas.get).not.toHaveBeenCalled()
  })
})

describe('wasClusterRemotelyModified', () => {
  const lastSyncedAt = new Date('2026-08-01T10:00:00Z')

  it.each([
    [null, '2026-08-02T10:00:00Z'],
    [lastSyncedAt, undefined],
    [lastSyncedAt, 'invalid-date'],
    [lastSyncedAt, '2026-08-02T10:00:00Z'],
  ])('returns true when the synchronization boundary is unsafe or older', (localDate, remoteDate) => {
    expect(wasClusterRemotelyModified(localDate, remoteDate)).toBe(true)
  })

  it.each(['2026-08-01T10:00:00Z', '2026-07-31T10:00:00Z'])(
    'returns false when the remote timestamp is not newer: %s',
    (remoteDate) => {
      expect(wasClusterRemotelyModified(lastSyncedAt, remoteDate)).toBe(false)
    },
  )
})
