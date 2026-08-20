import { beforeEach, describe, expect, it } from 'vitest'

import { createRemoteEntity } from '@/actions/atlas/internal/create-remote-entity.js'
import { makeAtlasClient } from '@/actions/atlas/test-support/fakes.js'
import { makeAtlasInput, makeAtlasResource } from '@/actions/atlas/test-support/fixtures.js'

describe('createRemoteEntity', () => {
  const atlas = makeAtlasClient()

  beforeEach(() => {
    atlas.post.mockReset()
  })

  it('creates an ATLAS entity and maps the response', async () => {
    const input = makeAtlasInput()
    atlas.post.mockResolvedValue({ data: makeAtlasResource() })

    await expect(createRemoteEntity({ input, atlasClient: atlas.client })).resolves.toMatchObject({
      id: 'atlas-1',
      atlasId: 'atlas-1',
      name: 'Remote entity',
      countryCode: 'LU',
    })

    expect(atlas.post).toHaveBeenCalledWith('/node/cluster', {
      body: {
        data: expect.objectContaining({
          type: 'node--cluster',
          attributes: expect.objectContaining({
            title: 'Local entity',
            field_registration_number: 'LU-123',
          }),
        }),
      },
    })
  })

  it('rejects an ATLAS response without created entity data', async () => {
    atlas.post.mockResolvedValue({})

    await expect(
      createRemoteEntity({ input: makeAtlasInput(), atlasClient: atlas.client }),
    ).rejects.toThrow('ATLAS did not return the created entity.')
  })
})
