import type { SyncStatus, EntityStatus } from '@/types.js'
import type { Entity, Taxonomy } from '@/db/schema.js'
import type { z } from 'zod'
import type { listQuerySchema, createOrUpdateEntitySchema } from '@/actions/entities/constants.js'

export type EntitiesStatusRecap = {
  total: number
  moderation: Record<EntityStatus, number>
  sync: Record<SyncStatus, number>
}

export type EntityWithRelationships = Entity & {
  thematicAreaIds?: string[]
  sectorIds?: string[]
  technologyIds?: string[]
  useCaseIds?: string[]
  fieldsOfActivityIds?: string[]
}

export type EntityWithFullRelationships = Entity & {
  clusterType?: Taxonomy
  country?: Taxonomy
  thematicAreas?: Taxonomy[]
  sectors?: Taxonomy[]
  technologies?: Taxonomy[]
  useCases?: Taxonomy[]
  fieldsOfActivity: Taxonomy[]
}

export type CreateOrUpdateEntity = z.infer<typeof createOrUpdateEntitySchema>

export type ListQuery = z.infer<typeof listQuerySchema>
