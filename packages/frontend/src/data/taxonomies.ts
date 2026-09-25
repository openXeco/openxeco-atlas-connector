import type { TaxonomyTypeInfo } from '@/types'

export const TAXONOMY_TYPES: TaxonomyTypeInfo[] = [
  { type: 'country', label: 'Countries', description: 'Geographic locations' },
  { type: 'cluster_type', label: 'Cluster Types', description: 'Types of cybersecurity clusters' },
  { type: 'languages', label: 'Languages', description: 'Supported languages' },
  { type: 'sectors', label: 'Sectors', description: 'Industry sectors' },
  { type: 'technologies', label: 'Technologies', description: 'Technology categories' },
  {
    type: 'applications_and_technologies',
    label: 'Applications & Technologies',
    description: 'Application domains',
  },
  { type: 'cluster_thematic_area', label: 'Thematic Areas', description: 'Cluster focus areas' },
  { type: 'fields_of_activity', label: 'Fields of Activity', description: 'Activity domains' },
  { type: 'nationality', label: 'Nationalities', description: 'National origins' },
  { type: 'use_cases', label: 'Use Cases', description: 'Application use cases' },
] as const
