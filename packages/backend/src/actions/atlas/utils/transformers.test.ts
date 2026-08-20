import { describe, expect, it } from 'vitest'

import {
  toClusterFromResource,
  toClusterInputFromEntity,
  toEntityFromCluster,
  toResourceFromCluster,
  toResourceFromEntity,
  toTaxonomyFromTerm,
  toTaxonomyTermFromResource,
} from '@/actions/atlas/utils/transformers.js'
import {
  makeAtlasCluster,
  makeAtlasInput,
  makeAtlasResource,
  makeEntity,
  makeTaxonomy,
} from '@/actions/atlas/test-support/fixtures.js'

describe('toClusterFromResource', () => {
  it('maps ATLAS attributes and relationships into a cluster', () => {
    const resource = makeAtlasResource({
      id: 'atlas-42',
      attributes: {
        title: 'English name',
        field_institution_name_in_nation: 'National name',
        field_entity_department: 'Research',
        field_address: {
          country_code: 'LU',
          locality: 'Luxembourg',
          address_line1: '1 Test Street',
        },
        field_general_contact_e_mail: 'info@example.test',
        field_url: { uri: 'https://example.test' },
        field_registration_number: 'LU-123',
        moderation_state: 'published',
        changed: '2026-08-01T10:00:00Z',
      },
      relationships: {
        field_country: {
          data: { type: 'taxonomy_term--country', id: 'country-lu' },
        },
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
      },
    })

    expect(toClusterFromResource(resource)).toMatchObject({
      id: 'atlas-42',
      atlasId: 'atlas-42',
      name: 'English name',
      nameNational: 'National name',
      entityDepartment: 'Research',
      countryCode: 'LU',
      city: 'Luxembourg',
      streetAddress: '1 Test Street',
      email: 'info@example.test',
      website: 'https://example.test',
      registrationNumber: 'LU-123',
      moderationState: 'published',
      updatedAt: '2026-08-01T10:00:00Z',
      countryId: 'country-lu',
      clusterTypeId: 'cluster-type-1',
      thematicAreaIds: ['thematic-1'],
      sectorIds: ['sector-1'],
      technologyIds: ['technology-1'],
      useCaseIds: ['use-case-1'],
      fieldsOfActivityIds: ['activity-1'],
    })
  })

  it('accepts ATLAS websites represented directly as strings', () => {
    const resource = makeAtlasResource({ attributes: { field_url: 'https://example.test' } })

    expect(toClusterFromResource(resource).website).toBe('https://example.test')
  })
})

describe('toClusterInputFromEntity', () => {
  it('uses ATLAS taxonomy identifiers and trims the registration number', () => {
    const clusterType = makeTaxonomy({
      id: 'local-cluster-type',
      atlasId: 'atlas-cluster-type',
      taxonomyType: 'cluster_type',
    })
    const thematicArea = makeTaxonomy({ atlasId: 'atlas-thematic', taxonomyType: 'cluster_thematic_area' })
    const sector = makeTaxonomy({ atlasId: 'atlas-sector', taxonomyType: 'sectors' })
    const technology = makeTaxonomy({ atlasId: 'atlas-technology', taxonomyType: 'technologies' })
    const useCase = makeTaxonomy({ atlasId: 'atlas-use-case', taxonomyType: 'use_cases' })
    const activity = makeTaxonomy({ atlasId: 'atlas-activity', taxonomyType: 'fields_of_activity' })
    const entity = makeEntity({
      name: 'Local entity',
      status: 'ready_for_publication',
      registrationNumber: '  LU-123  ',
      clusterTypeId: 'local-cluster-type',
      clusterType,
      thematicAreas: [thematicArea],
      sectors: [sector],
      technologies: [technology],
      useCases: [useCase],
      fieldsOfActivity: [activity],
    })

    expect(toClusterInputFromEntity(entity)).toMatchObject({
      name: 'Local entity',
      registrationNumber: 'LU-123',
      moderationState: 'ready_for_publication',
      clusterTypeId: 'atlas-cluster-type',
      thematicAreaIds: ['atlas-thematic'],
      sectorIds: ['atlas-sector'],
      technologyIds: ['atlas-technology'],
      useCaseIds: ['atlas-use-case'],
      fieldsOfActivityIds: ['atlas-activity'],
    })
  })
})

describe('toEntityFromCluster', () => {
  it('maps a synchronized cluster into local entity data', () => {
    const cluster = makeAtlasCluster({
      name: 'Remote entity',
      nameNational: 'National name',
      moderationState: 'published',
      countryId: 'country-lu',
      clusterTypeId: 'cluster-type-1',
      thematicAreaIds: ['thematic-1'],
      sectorIds: ['sector-1'],
    })

    const entity = toEntityFromCluster(cluster)

    expect(entity).toMatchObject({
      atlasId: 'atlas-1',
      name: 'Remote entity',
      nameNational: 'National name',
      status: 'published',
      syncStatus: 'synced',
      syncCode: null,
      countryId: 'country-lu',
      clusterTypeId: 'cluster-type-1',
      thematicAreaIds: ['thematic-1'],
      sectorIds: ['sector-1'],
    })
    expect(entity.lastSyncedAt).toBeInstanceOf(Date)
  })

  it('uses draft and null local values for absent optional ATLAS data', () => {
    const entity = toEntityFromCluster(makeAtlasCluster({ moderationState: undefined }))

    expect(entity.status).toBe('draft')
    expect(entity.email).toBeNull()
    expect(entity.clusterTypeId).toBeNull()
  })
})

describe('ATLAS resource serialization', () => {
  it('maps cluster input into JSON:API attributes and relationships', () => {
    const input = makeAtlasInput({
      city: 'Luxembourg',
      streetAddress: '1 Test Street',
      website: 'https://example.test',
      isHeadquarter: false,
      headquarterInfo: 'Parent organisation',
      clusterTypeId: 'cluster-type-1',
      sectorIds: ['sector-1'],
      moderationState: 'ready_for_publication',
    })

    expect(toResourceFromCluster(input, 'atlas-1')).toMatchObject({
      type: 'node--cluster',
      id: 'atlas-1',
      attributes: {
        title: 'Local entity',
        field_address: {
          country_code: 'LU',
          locality: 'Luxembourg',
          address_line1: '1 Test Street',
        },
        field_url: { uri: 'https://example.test' },
        field_registration_number: 'LU-123',
        field_question_headquarter: false,
        field_headquarter: 'Parent organisation',
        moderation_state: 'ready_for_publication',
      },
      relationships: {
        field_cluster_type: {
          data: { type: 'taxonomy_term--cluster_type', id: 'cluster-type-1' },
        },
        field_sectors: {
          data: [{ type: 'taxonomy_term--sectors', id: 'sector-1' }],
        },
      },
    })
  })

  it('serializes a local entity through its related ATLAS taxonomy identifiers', () => {
    const entity = makeEntity({
      name: 'Local entity',
      status: 'draft',
      clusterType: makeTaxonomy({ atlasId: 'atlas-cluster-type', taxonomyType: 'cluster_type' }),
    })

    expect(toResourceFromEntity(entity)).toMatchObject({
      attributes: { title: 'Local entity', moderation_state: 'draft' },
      relationships: {
        field_cluster_type: {
          data: { type: 'taxonomy_term--cluster_type', id: 'atlas-cluster-type' },
        },
      },
    })
  })
})

describe('taxonomy transformation', () => {
  it('maps an ATLAS taxonomy resource and its parent', () => {
    const resource = makeAtlasResource({
      id: 'sector-1',
      attributes: { name: 'Finance', description: 'Financial sector' },
      relationships: {
        parent: {
          data: { type: 'taxonomy_term--sectors', id: 'sector-parent' },
        },
      },
    })

    expect(toTaxonomyTermFromResource(resource, 'sectors')).toEqual({
      id: 'sector-1',
      atlasId: 'sector-1',
      type: 'sectors',
      name: 'Finance',
      description: 'Financial sector',
      parentId: 'sector-parent',
      metadata: resource.attributes,
    })
  })

  it('maps an ATLAS taxonomy term into database values', () => {
    const taxonomy = toTaxonomyFromTerm({
      id: 'sector-1',
      atlasId: 'sector-1',
      type: 'sectors',
      name: 'Finance',
      description: undefined,
      parentId: undefined,
      metadata: { source: 'ATLAS' },
    })

    expect(taxonomy).toMatchObject({
      atlasId: 'sector-1',
      taxonomyType: 'sectors',
      name: 'Finance',
      description: '',
      parentId: null,
      metadata: { source: 'ATLAS' },
    })
    expect(taxonomy.lastSyncedAt).toBeInstanceOf(Date)
  })
})
