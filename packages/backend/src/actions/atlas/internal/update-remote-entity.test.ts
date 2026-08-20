import { beforeEach, describe, expect, it } from 'vitest'

import { updateRemoteEntity } from '@/actions/atlas/internal/update-remote-entity.js'
import { AtlasApiError } from '@/actions/atlas/utils/atlas-api-error.js'
import { makeAtlasClient } from '@/actions/atlas/test-support/fakes.js'
import { makeAtlasInput, makeAtlasResource } from '@/actions/atlas/test-support/fixtures.js'

describe('updateRemoteEntity', () => {
  const atlas = makeAtlasClient()
  const input = makeAtlasInput({ registrationNumber: undefined })

  beforeEach(() => {
    atlas.get.mockReset()
    atlas.patch.mockReset()
  })

  it('returns not found when the entity cannot be read from ATLAS', async () => {
    atlas.get.mockRejectedValue(new AtlasApiError('Not found', 404))

    await expect(
      updateRemoteEntity({ atlasId: 'atlas-1', input, lastSyncedAt: null, atlasClient: atlas.client }),
    ).resolves.toEqual({
      code: 'not_found',
      atlasId: 'atlas-1',
    })

    expect(atlas.patch).not.toHaveBeenCalled()
  })

  it('rethrows a read error other than not found', async () => {
    const error = new AtlasApiError('Unavailable', 503)
    atlas.get.mockRejectedValue(error)

    await expect(
      updateRemoteEntity({ atlasId: 'atlas-1', input, lastSyncedAt: null, atlasClient: atlas.client }),
    ).rejects.toBe(error)
  })

  it('returns conflicting fields without patching a remotely modified entity', async () => {
    atlas.get.mockResolvedValue({
      data: makeAtlasResource({
        attributes: {
          title: 'Remote entity',
          field_address: { country_code: 'LU' },
          changed: '2026-08-02T10:00:00Z',
        },
      }),
    })

    await expect(
      updateRemoteEntity({
        atlasId: 'atlas-1',
        input,
        lastSyncedAt: new Date('2026-08-01T10:00:00Z'),
        atlasClient: atlas.client,
      }),
    ).resolves.toEqual({
      code: 'conflict',
      atlasId: 'atlas-1',
      conflictFields: ['name'],
    })

    expect(atlas.patch).not.toHaveBeenCalled()
  })

  it('updates without comparing differences when the remote entity predates the last sync', async () => {
    atlas.get.mockResolvedValue({
      data: makeAtlasResource({
        attributes: {
          title: 'Different remote name',
          field_address: { country_code: 'LU' },
          changed: '2026-07-31T10:00:00Z',
        },
      }),
    })
    atlas.patch.mockResolvedValue({ data: makeAtlasResource() })

    await expect(
      updateRemoteEntity({
        atlasId: 'atlas-1',
        input,
        lastSyncedAt: new Date('2026-08-01T10:00:00Z'),
        atlasClient: atlas.client,
      }),
    ).resolves.toMatchObject({
      code: 'updated',
      cluster: { atlasId: 'atlas-1' },
    })

    expect(atlas.patch).toHaveBeenCalledOnce()
  })

  it('patches when a remote modification does not conflict with local input', async () => {
    atlas.get.mockResolvedValue({
      data: makeAtlasResource({
        attributes: {
          title: 'Local entity',
          field_address: { country_code: 'LU' },
          changed: '2026-08-02T10:00:00Z',
        },
      }),
    })
    atlas.patch.mockResolvedValue({ data: makeAtlasResource() })

    await expect(
      updateRemoteEntity({
        atlasId: 'atlas-1',
        input,
        lastSyncedAt: new Date('2026-08-01T10:00:00Z'),
        atlasClient: atlas.client,
      }),
    ).resolves.toMatchObject({
      code: 'updated',
      cluster: { atlasId: 'atlas-1' },
    })

    expect(atlas.patch).toHaveBeenCalledWith('/node/cluster/atlas-1', {
      body: {
        data: expect.objectContaining({
          type: 'node--cluster',
          id: 'atlas-1',
          attributes: expect.objectContaining({ title: 'Local entity' }),
        }),
      },
    })
  })

  it('returns not found when the entity disappears before patching', async () => {
    atlas.get.mockResolvedValue({
      data: makeAtlasResource({ attributes: { changed: '2026-07-31T10:00:00Z' } }),
    })
    atlas.patch.mockRejectedValue(new AtlasApiError('Not found', 404))

    await expect(
      updateRemoteEntity({
        atlasId: 'atlas-1',
        input,
        lastSyncedAt: new Date('2026-08-01T10:00:00Z'),
        atlasClient: atlas.client,
      }),
    ).resolves.toEqual({
      code: 'not_found',
      atlasId: 'atlas-1',
    })
  })

  it('rejects an ATLAS response without updated entity data', async () => {
    atlas.get.mockResolvedValue({
      data: makeAtlasResource({ attributes: { changed: '2026-07-31T10:00:00Z' } }),
    })
    atlas.patch.mockResolvedValue({})

    await expect(
      updateRemoteEntity({
        atlasId: 'atlas-1',
        input,
        lastSyncedAt: new Date('2026-08-01T10:00:00Z'),
        atlasClient: atlas.client,
      }),
    ).rejects.toThrow('ATLAS did not return the updated entity.')
  })

  it('rethrows a patch error other than not found', async () => {
    const error = new AtlasApiError('Unavailable', 503)
    atlas.get.mockResolvedValue({
      data: makeAtlasResource({ attributes: { changed: '2026-07-31T10:00:00Z' } }),
    })
    atlas.patch.mockRejectedValue(error)

    await expect(
      updateRemoteEntity({
        atlasId: 'atlas-1',
        input,
        lastSyncedAt: new Date('2026-08-01T10:00:00Z'),
        atlasClient: atlas.client,
      }),
    ).rejects.toBe(error)
  })
})
