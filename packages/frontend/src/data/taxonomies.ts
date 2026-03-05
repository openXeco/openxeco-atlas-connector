import { TaxonomyTypeInfo } from '@/types'

export const TAXONOMY_TYPES: TaxonomyTypeInfo[] = [
  { type: 'country', label: 'Countries', description: 'Geographic locations' },
  { type: 'cluster_type', label: 'Cluster Types', description: 'Types of cybersecurity clusters' },
  { type: 'legal_status', label: 'Legal Status', description: 'Legal entity types' },
  { type: 'languages', label: 'Languages', description: 'Supported languages' },
  { type: 'sectors', label: 'Sectors', description: 'Industry sectors' },
  { type: 'technologies', label: 'Technologies', description: 'Technology categories' },
  {
    type: 'activities_of_interest',
    label: 'Activities of Interest',
    description: 'Areas of activity',
  },
  {
    type: 'applications_and_technologies',
    label: 'Applications & Technologies',
    description: 'Application domains',
  },
  { type: 'cluster_thematic_area', label: 'Thematic Areas', description: 'Cluster focus areas' },
  {
    type: 'cybersecurity_research_projects',
    label: 'Research Projects',
    description: 'Cybersecurity research',
  },
  {
    type: 'european_cybersecurity_competenc',
    label: 'EU Competencies',
    description: 'European competencies',
  },
  { type: 'fields_of_activity', label: 'Fields of Activity', description: 'Activity domains' },
  { type: 'funding_sources', label: 'Funding Sources', description: 'Sources of funding' },
  { type: 'initiatives', label: 'Initiatives', description: 'Cybersecurity initiatives' },
  { type: 'nationality', label: 'Nationalities', description: 'National origins' },
  { type: 'position_category', label: 'Position Categories', description: 'Job position types' },
  { type: 'use_cases', label: 'Use Cases', description: 'Application use cases' },
  { type: 'citations_source', label: 'Citation Sources', description: 'Reference sources' },
] as const
