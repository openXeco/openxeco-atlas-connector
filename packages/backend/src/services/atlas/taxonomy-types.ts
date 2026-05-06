import { z } from 'zod'

export const TAXONOMY_TYPES = [
  'activities_of_interest',
  'applications_and_technologies',
  'cluster_thematic_area',
  'cluster_type',
  'country',
  'cybersecurity_research_projects',
  'european_cybersecurity_competenc',
  'fields_of_activity',
  'funding_sources',
  'initiatives',
  'languages',
  'legal_status',
  'nationality',
  'position_category',
  'sectors',
  'technologies',
  'use_cases',
] as const

export const taxonomyTypeSchema = z.enum(TAXONOMY_TYPES)
