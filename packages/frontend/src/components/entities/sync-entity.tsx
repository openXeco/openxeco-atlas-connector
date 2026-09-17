import type { Entity } from '@/types'
import type React from 'react'

import { CardContent, Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatusBadge } from '@/components/entities/status-badge'
import { SYNC_STATUS_DEFINITIONS } from '@/lib/constants'
import { EntityMetadata } from '@/components/entities/entity-metadata'
import { PushEntityButton } from '@/components/entities/push-entity-button'
import { Pencil, DatabaseArrowUp, TableOfContents } from 'lucide-react'
import { Link } from '@/components/ui/link'

const getActionButton = (action: string, entityId: string) => {
  switch (action) {
    case 'push':
      return <PushEntityButton id={entityId} />

    case 'edit':
      return (
        <Link href={`/entities/${entityId}/edit`} variant={'outline'}>
          <Pencil className='h-4 w-4' />
          Edit
        </Link>
      )

    default:
      return <p>Action {action} not defined.</p>
  }
}

export const SyncEntity = ({ entity }: { entity: Entity }) => {
  const syncDefinition = SYNC_STATUS_DEFINITIONS[entity.syncStatus]

  return (
    <div className={'flex flex-col gap-8'}>
      <EntityMetadata entity={entity} />
      <Card>
        <CardHeader>
          <CardTitle className={'flex items-center gap-2'}>
            <DatabaseArrowUp className='h-5 w-5' />
            Sync status
          </CardTitle>
          <CardDescription>
            This view summarizes the entity’s status compared with its ATLAS counterpart.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={'flex flex-col gap-4'}>
            <div className={'flex items-center gap-2'}>
              <StatusBadge type={'sync'} status={entity.syncStatus} />
              <div>
                <p>{syncDefinition.description}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className={'flex items-center gap-2'}>
            <TableOfContents className={'h-5 w-5'} />
            Available actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={'flex flex-col gap-4'}>
            <div className={'flex items-center gap-2'}>
              {syncDefinition.actions.map((a) => (
                <div key={a}>{getActionButton(a, entity.id)}</div>
              ))}
              {syncDefinition.actions.length < 1 && <p>No available actions</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
