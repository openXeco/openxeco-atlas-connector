import { CardHeader, CardTitle, CardContent, Card } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { EntityDisplayField } from '@/components/entities/entity-display-field'
import { formatDate } from '@/lib/utils'
import type { Entity } from '@/types'

export const EntityMetadata = ({ entity }: { entity: Entity }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Clock className='h-5 w-5' />
          Metadata
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <EntityDisplayField title={'Created'} value={formatDate(entity.createdAt.toString(), true)} />
        <EntityDisplayField title={'Last Updated'} value={formatDate(entity.updatedAt.toString(), true)} />

        {entity.lastSyncedAt && (
          <EntityDisplayField title={'Last Synced'} value={formatDate(entity.lastSyncedAt.toString(), true)} />
        )}
        {entity.atlasId && <EntityDisplayField title={'Atlas ID'} value={entity.atlasId} />}
      </CardContent>
    </Card>
  )
}
