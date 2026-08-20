import { describe, expect, it } from 'vitest'

import {
  buildJsonApiRelationships,
  extractIdsFromJsonRelationship,
} from '@/actions/atlas/utils/atlas-relationships.js'
import { makeAtlasInput } from '@/actions/atlas/test-support/fixtures.js'

describe('extractIdsFromJsonRelationship', () => {
  it('returns undefined for a missing, null, or empty relationship', () => {
    expect(extractIdsFromJsonRelationship(undefined)).toBeUndefined()
    expect(extractIdsFromJsonRelationship({ data: null })).toBeUndefined()
    expect(extractIdsFromJsonRelationship({ data: [] })).toBeUndefined()
  })

  it('extracts identifiers from singular and plural relationships', () => {
    expect(
      extractIdsFromJsonRelationship({
        data: { type: 'taxonomy_term--sectors', id: 'sector-1' },
      }),
    ).toEqual(['sector-1'])

    expect(
      extractIdsFromJsonRelationship({
        data: [
          { type: 'taxonomy_term--sectors', id: 'sector-1' },
          { type: 'taxonomy_term--sectors', id: 'sector-2' },
        ],
      }),
    ).toEqual(['sector-1', 'sector-2'])
  })
})

describe('buildJsonApiRelationships', () => {
  it('builds every ATLAS taxonomy relationship with the correct field and resource type', () => {
    const relationships = buildJsonApiRelationships(
      makeAtlasInput({
        clusterTypeId: 'cluster-type-1',
        thematicAreaIds: ['thematic-1'],
        sectorIds: ['sector-1'],
        technologyIds: ['technology-1'],
        useCaseIds: ['use-case-1'],
        fieldsOfActivityIds: ['activity-1'],
      }),
    )

    expect(relationships).toEqual({
      field_cluster_type: {
        data: { type: 'taxonomy_term--cluster_type', id: 'cluster-type-1' },
      },
      field_cluster_thematic_area: {
        data: [{ type: 'taxonomy_term--cluster_thematic_area', id: 'thematic-1' }],
      },
      field_sectors: {
        data: [{ type: 'taxonomy_term--sectors', id: 'sector-1' }],
      },
      field_technologies: {
        data: [{ type: 'taxonomy_term--technologies', id: 'technology-1' }],
      },
      field_use_cases: {
        data: [{ type: 'taxonomy_term--use_cases', id: 'use-case-1' }],
      },
      field_field_of_activity: {
        data: [{ type: 'taxonomy_term--fields_of_activity', id: 'activity-1' }],
      },
    })
  })

  it('uses null and empty relationship data to clear absent taxonomy values', () => {
    expect(buildJsonApiRelationships(makeAtlasInput())).toEqual({
      field_cluster_type: { data: null },
      field_cluster_thematic_area: { data: [] },
      field_sectors: { data: [] },
      field_technologies: { data: [] },
      field_use_cases: { data: [] },
      field_field_of_activity: { data: [] },
    })
  })
})
