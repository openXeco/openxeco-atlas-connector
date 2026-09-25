import type { Entity, EntityStatus } from '@/types'
import { fieldLabel } from '@/lib/utils'
import { MODERATION_STATUS_LABELS } from '@/lib/constants'

// Taxonomy conflict values contain names; use local names for the comparison display too.
const localConflictValues = (entity: Entity): Record<string, unknown> => ({
  ...entity,
  moderationState: entity.status,
  registrationNumber: entity.registrationNumber?.trim(),
  clusterTypeId: entity.clusterType?.name,
  thematicAreaIds: entity.thematicAreas?.map((taxonomy) => taxonomy.name),
  sectorIds: entity.sectors?.map((taxonomy) => taxonomy.name),
  technologyIds: entity.technologies?.map((taxonomy) => taxonomy.name),
  useCaseIds: entity.useCases?.map((taxonomy) => taxonomy.name),
  fieldsOfActivityIds: entity.fieldsOfActivity?.map((taxonomy) => taxonomy.name),
})

const formatValue = (field: string, value: unknown): string => {
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
    return 'Not set'
  }

  if (field === 'moderationState' && typeof value === 'string') {
    return MODERATION_STATUS_LABELS[value as EntityStatus] ?? value
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatValue(field, item)).join('\n')
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

export const EntityDifferences = ({
  entity,
  differences,
}: {
  entity: Entity
  differences: Record<string, unknown>
}) => {
  const local = localConflictValues(entity)

  return (
    <div className='divide-y'>
      {Object.entries(differences).map(([field, remote]) => (
        <section key={field} className='space-y-3 py-4 first:pt-0'>
          <h4 className='text-sm font-medium'>
            {field === 'moderationState' ? 'Status' : fieldLabel(field.replace(/Ids?$/, ''))}
          </h4>
          <dl className='grid gap-4 text-sm sm:grid-cols-2'>
            <div className='min-w-0'>
              <dt className='mb-1 text-muted-foreground'>Local</dt>
              <dd className='whitespace-pre-wrap break-words'>{formatValue(field, local[field])}</dd>
            </div>
            <div className='min-w-0'>
              <dt className='mb-1 text-muted-foreground'>ATLAS</dt>
              <dd className='whitespace-pre-wrap break-words'>{formatValue(field, remote)}</dd>
            </div>
          </dl>
        </section>
      ))}
    </div>
  )
}
