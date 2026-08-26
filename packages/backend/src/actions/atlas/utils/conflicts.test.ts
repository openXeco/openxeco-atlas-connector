import { describe, expect, it } from 'vitest'

import { findConflictFields, normalizeClusterField } from '@/actions/atlas/utils/conflicts.js'
import { makeAtlasCluster, makeAtlasInput } from '@/actions/atlas/test-support/fixtures.js'

describe('normalizeClusterField', () => {
  it('treats null and undefined scalar values as the same absent value', () => {
    expect(normalizeClusterField('website', null)).toBeNull()
    expect(normalizeClusterField('website', undefined)).toBeNull()
  })

  it('sorts taxonomy identifiers without mutating the source array', () => {
    const ids = ['sector-2', 'sector-1']

    expect(normalizeClusterField('sectorIds', ids)).toEqual(['sector-1', 'sector-2'])
    expect(ids).toEqual(['sector-2', 'sector-1'])
    expect(normalizeClusterField('sectorIds', undefined)).toEqual([])
  })
})

describe('findConflictFields', () => {
  it('ignores taxonomy ordering and moderation status', () => {
    const local = makeAtlasInput({
      thematicAreaIds: ['thematic-2', 'thematic-1'],
      moderationState: 'draft',
    })
    const remote = makeAtlasCluster({
      ...local,
      thematicAreaIds: ['thematic-1', 'thematic-2'],
      moderationState: 'published',
    })

    expect(findConflictFields(local, remote)).toEqual([])
  })

  it('reports changed scalar and taxonomy fields', () => {
    const local = makeAtlasInput({ website: 'https://local.example', sectorIds: ['sector-1'] })
    const remote = makeAtlasCluster({
      ...local,
      website: 'https://remote.example',
      sectorIds: ['sector-2'],
    })

    expect(findConflictFields(local, remote)).toEqual(['website', 'sectorIds'])
  })
})
