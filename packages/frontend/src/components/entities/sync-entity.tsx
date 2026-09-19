import type { Entity, SyncLog } from '@/types'

import { CardContent, Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatusBadge } from '@/components/entities/status-badge'
import { SYNC_STATUS_DEFINITIONS, SYNC_CODE_DEFINITIONS, atlasErrorLabels, syncOperationLabels } from '@/lib/constants'
import { EntityMetadata } from '@/components/entities/entity-metadata'
import { PushEntityButton } from '@/components/entities/push-entity-button'
import { Pencil, DatabaseArrowUp, TableOfContents } from 'lucide-react'
import { Link } from '@/components/ui/link'
import { formatDate, fieldLabel, asText, asRecord } from '@/lib/utils'
import { EntityDisplayField } from '@/components/entities/entity-display-field'

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

const formatLog = (log: SyncLog) => {
  const details = asRecord(log.details)
  const succeeded = log.status === 'synced' || log.status === 'success'
  const failed = log.status === 'failed'
  const conflict = failed && details.syncCode === 'conflict'
  const notFound = failed && details.syncCode === 'not_found'
  const message = asText(details.errorMessage)
  const atlasId = asText(details.atlasId)
  const conflictFields = Array.isArray(details.conflictFields)
    ? [...new Set(details.conflictFields.map(asText).filter(Boolean))]
    : []
  const errors = Array.isArray(details.errorDetails)
    ? details.errorDetails
        .map(asRecord)
        .filter((error) => ['title', 'detail', 'status', 'code'].some((key) => asText(error[key])))
    : []
  const title = succeeded
    ? 'Synchronization completed'
    : conflict
      ? 'Conflicting changes need review'
      : notFound
        ? 'Linked entity not found in ATLAS'
        : failed && 'Synchronization failed'

  const date = log.createdAt && !Number.isNaN(Date.parse(log.createdAt)) ? log.createdAt : undefined

  return (
    <div className='mt-3 space-y-4 rounded-lg border bg-muted/30 p-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='font-medium'>{title}</p>
        <StatusBadge type={'sync'} status={failed ? 'failed' : 'synced'} />
      </div>
      <dl className='grid gap-3 text-sm sm:grid-cols-2'>
        <EntityDisplayField
          title={'Operation'}
          value={syncOperationLabels[log.operation] || fieldLabel(log.operation)}
        />
        <EntityDisplayField title={'Date'} value={date ? formatDate(date, true) : 'Date unavailable'} />
        {atlasId && <EntityDisplayField className={'sm:col-span-2'} title={'ATLAS ID'} value={atlasId} />}
      </dl>
      {conflict && (
        <div className='space-y-2 text-sm'>
          <p>The local and ATLAS versions contain conflicting changes. Review them before synchronizing again.</p>
          {conflictFields.length > 0 && (
            <div>
              <p className='font-medium'>Conflicting fields</p>
              <ul className='list-disc space-y-1 pl-5'>
                {conflictFields.map((field) => (
                  <li key={field}>{fieldLabel(field)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {notFound && (
        <p className='text-sm'>The linked ATLAS entity could not be found. Check its correspondence before retrying.</p>
      )}
      {failed && message && <p className='whitespace-pre-wrap break-words text-sm'>{message}</p>}
      {failed && errors.length > 0 && (
        <div className='space-y-2'>
          <p className='text-sm font-medium'>Details from ATLAS</p>
          <ul className='space-y-2'>
            {errors.map((error, index) => {
              const status = asText(error.status)
              const code = asText(error.code)
              const source = asRecord(error.source)
              const field = asText(source.pointer) || asText(source.parameter)
              const title =
                asText(error.title) ||
                atlasErrorLabels[status] ||
                (/^5\d{2}$/.test(status) ? 'ATLAS service error' : 'ATLAS error')
              const detail = asText(error.detail)

              return (
                <li
                  // biome-ignore lint/suspicious/noArrayIndexKey: Errors are an immutable log snapshot and may contain identical entries.
                  key={`${index}-${code}-${status}`}
                  className='space-y-1 rounded-md border bg-background p-3 text-sm'
                >
                  <p className='font-medium break-words'>{title}</p>
                  {detail && detail !== title && <p className='whitespace-pre-wrap break-words'>{detail}</p>}
                  {field && <p className='break-words'>Field: {fieldLabel(field)}</p>}
                  {(status || code) && (
                    <p className='break-words text-xs text-muted-foreground'>
                      {[status && `HTTP ${status}`, code && `Code: ${code}`].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {failed && !message && errors.length === 0 && !conflict && !notFound && (
        <p className='text-sm text-muted-foreground'>No error details were recorded for this attempt.</p>
      )}
    </div>
  )
}

export const SyncEntity = ({ entity, logs }: { entity: Entity; logs: SyncLog[] }) => {
  const syncDefinition = SYNC_STATUS_DEFINITIONS[entity.syncStatus]
  const syncCodeDefinition = entity.syncCode !== null ? SYNC_CODE_DEFINITIONS[entity.syncCode] : undefined

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
                <p>
                  {entity.syncStatus === 'failed'
                    ? syncCodeDefinition?.description || syncDefinition.description
                    : syncDefinition.description}
                </p>
              </div>
            </div>
            <div>
              <strong>Latest sync log</strong>
              {logs[0] ? (
                formatLog(logs[0])
              ) : (
                <p className='mt-2 text-sm text-muted-foreground'>No synchronization attempts recorded yet.</p>
              )}
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
              {entity.syncStatus === 'failed' && syncCodeDefinition !== undefined ? (
                syncCodeDefinition.actions.map((a) => {
                  return getActionButton(a, entity.id)
                })
              ) : syncDefinition.actions.length ? (
                syncDefinition.actions.map((a) => <div key={a}>{getActionButton(a, entity.id)}</div>)
              ) : (
                <p>No actions available</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
