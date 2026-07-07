import { z } from 'zod'

export const TAXONOMY_TYPES = [
  'applications_and_technologies',
  'cluster_thematic_area',
  'cluster_type',
  'country',
  'fields_of_activity',
  'languages',
  'nationality',
  'sectors',
  'technologies',
  'use_cases',
] as const

export const taxonomyTypeSchema = z.enum(TAXONOMY_TYPES)
