import type { EntityWithFullRelationships } from '@/actions/entities/types.js'
import type { AtlasCluster, AtlasClusterInput, AtlasJsonApiResource } from '@/actions/atlas/types.js'
import type { Taxonomy } from '@/db/schema.js'

export const makeAtlasInput = (overrides: Partial<AtlasClusterInput> = {}): AtlasClusterInput => ({
  name: 'Local entity',
  countryCode: 'LU',
  registrationNumber: 'LU-123',
  ...overrides,
})

export const makeAtlasCluster = (overrides: Partial<AtlasCluster> = {}): AtlasCluster => ({
  atlasId: 'atlas-1',
  name: 'Remote entity',
  countryCode: 'LU',
  ...overrides,
})

export const makeAtlasResource = (
  overrides: Partial<Omit<AtlasJsonApiResource, 'attributes'>> & {
    attributes?: Record<string, unknown>
  } = {},
): AtlasJsonApiResource => ({
  type: 'node--cluster',
  id: 'atlas-1',
  ...overrides,
  attributes: {
    title: 'Remote entity',
    field_address: { country_code: 'LU' },
    ...overrides.attributes,
  },
})

export const makeEntity = (overrides: Partial<EntityWithFullRelationships> = {}): EntityWithFullRelationships =>
  ({
    id: 'entity-1',
    atlasId: null,
    registrationNumber: null,
    syncStatus: 'pending_push',
    syncCode: null,
    lastSyncedAt: null,
    fieldsOfActivity: [],
    ...overrides,
  }) as EntityWithFullRelationships

export const makeTaxonomy = (overrides: Partial<Taxonomy> = {}): Taxonomy => ({
  id: 'local-taxonomy-1',
  atlasId: 'atlas-taxonomy-1',
  taxonomyType: 'sectors',
  name: 'Taxonomy term',
  description: null,
  parentId: null,
  metadata: null,
  lastSyncedAt: null,
  ...overrides,
})
