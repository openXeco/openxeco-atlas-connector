import { CardContent, Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatusBadge } from '@/components/entities/status-badge'
import type { Entity } from '@/types'
import { ENTITY_STATUS_DEFINITIONS, SYNC_STATUS_DEFINITIONS } from '@/lib/constants'

export const SyncEntity = ({ entity }: { entity: Entity }) => {
  const _definition = ENTITY_STATUS_DEFINITIONS[entity.status]
  const syncDefinition = SYNC_STATUS_DEFINITIONS[entity.syncStatus]

  return (
    <Card>
      <CardHeader>
        <CardTitle className={'flex items-center gap-2'}>Sync status</CardTitle>
        <CardDescription>This view summarizes the entity’s status compared with its ATLAS counterpart.</CardDescription>
      </CardHeader>
      <CardContent>
        <StatusBadge type={'sync'} status={entity.syncStatus} />
        <p>{syncDefinition.description}</p>
      </CardContent>
    </Card>
  )
}
