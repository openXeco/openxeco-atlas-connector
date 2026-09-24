'use client'

import { useActionState } from 'react'
import { useSWRConfig } from 'swr'
import { TableOfContents } from 'lucide-react'
import type { Entity } from '@/types'
import { getEntitySyncActions, type EntityAction } from '@/lib/constants'
import { checkConflicts, forcePullEntity, forcePushEntity, pushEntity } from '@/app/actions/entities'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ActionButton } from '@/components/ui/action-button'
import { PushEntityButton } from '@/components/entities/buttons/push-entity-button'
import { EditEntityButton } from '@/components/entities/buttons/edit-entity-button'
import { CheckEntityConflictsButton } from '@/components/entities/buttons/check-entity-conflicts-button'
import { EntityDifferences } from '@/components/entities/entity-differences'

type SyncActionsState = {
  differences?: Record<string, unknown>
  error?: string
  message?: string
}

// Reset transient results when a different entity or a refreshed revision arrives.
export const SyncActions = ({ entity }: { entity: Entity }) => (
  <SyncActionsContent
    key={JSON.stringify([entity.id, entity.updatedAt, entity.atlasId, entity.syncStatus, entity.syncCode])}
    entity={entity}
  />
)

const SyncActionsContent = ({ entity }: { entity: Entity }) => {
  const { mutate } = useSWRConfig()

  const [state, formAction, pending] = useActionState(
    async (previous: SyncActionsState, formData: FormData): Promise<SyncActionsState> => {
      const operation = formData.get('operation')
      if (operation === 'check_conflicts') {
        const result = await checkConflicts(undefined, formData)
        return result.success ? { differences: result.data } : { ...previous, error: result.error, message: undefined }
      }

      if (operation !== 'push' && operation !== 'force_push' && operation !== 'force_pull') {
        return { ...previous, error: 'This action is not available.' }
      }

      const action = operation === 'push' ? pushEntity : operation === 'force_push' ? forcePushEntity : forcePullEntity
      const result = await action(undefined, formData)

      // Failed synchronization can also change the backend status and logs.
      const refreshed = await Promise.allSettled([
        mutate(`/api/entities/${entity.id}`),
        mutate(`/api/sync/logs?entityId=${entity.id}`),
      ])

      if (!result.success) {
        return { ...previous, error: result.error, message: undefined }
      }

      return {
        differences: {},
        message: result.message,
        error: refreshed.some((result) => result.status === 'rejected')
          ? 'Synchronization succeeded, but the latest status could not be loaded. Refresh the page.'
          : undefined,
      }
    },
    {},
  )

  const checked = state.differences !== undefined
  const hasDifferences = state.differences !== undefined && Object.keys(state.differences).length > 0
  const hasPersistedConflict = entity.syncStatus === 'failed' && entity.syncCode === 'conflict'
  const canForce = Boolean(entity.atlasId) && (hasPersistedConflict || hasDifferences)

  const actions: readonly EntityAction[] = checked
    ? hasDifferences
      ? ['check_conflicts', 'edit', ...(canForce ? (['force_push', 'force_pull'] as const) : [])]
      : ['edit']
    : getEntitySyncActions(entity)

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <TableOfContents className='h-5 w-5' />
          {hasDifferences ? 'Entity differences' : 'Available actions'}
        </CardTitle>
        {hasDifferences && (
          <CardDescription>
            {canForce
              ? 'Review the differing fields. Force push overwrites ATLAS with local data; force pull replaces local data with ATLAS data.'
              : 'Review the differing fields. Edit the local entity or check again after making changes.'}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className='space-y-4'>
        {hasDifferences && state.differences && <EntityDifferences entity={entity} differences={state.differences} />}
        {checked && !hasDifferences && (
          <p role='status' className='text-sm'>
            {state.message ||
              (canForce
                ? 'The differences were solved. The local and ATLAS versions now match.'
                : 'No differences found. The local and ATLAS versions match.')}
          </p>
        )}
        {state.error && !pending && (
          <p role='alert' className='text-sm text-destructive'>
            {state.error}
          </p>
        )}
        {actions.length === 0 && <p>No actions available</p>}
      </CardContent>
      <CardFooter className='flex flex-wrap items-start gap-2'>
        {actions.map((action) => {
          if (action === 'edit') {
            return <EditEntityButton key={action} id={entity.id} />
          }

          if (action === 'check_conflicts') {
            return (
              <CheckEntityConflictsButton
                key={action}
                id={entity.id}
                formAction={formAction}
                pending={pending}
                label={checked ? 'Check conflicts again' : 'Check conflicts'}
              />
            )
          }

          if (action === 'push') {
            return <PushEntityButton key={action} id={entity.id} formAction={formAction} pending={pending} />
          }

          if (action === 'force_push' || action === 'force_pull') {
            return (
              <ActionButton
                key={action}
                formAction={formAction}
                pending={pending}
                label={action === 'force_push' ? 'Force push' : 'Force pull'}
                syncingLabel='Synchronizing...'
                variant={action === 'force_pull' ? 'pull' : 'push'}
                hiddenFields={
                  <>
                    <input type='hidden' name='id' value={entity.id} />
                    <input type='hidden' name='operation' value={action} />
                  </>
                }
              />
            )
          }

          return <p key={action}>Action {action} not defined.</p>
        })}
      </CardFooter>
    </Card>
  )
}
