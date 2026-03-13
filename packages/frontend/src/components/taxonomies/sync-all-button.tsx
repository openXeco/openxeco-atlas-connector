'use client'

import { syncAll } from '@/app/actions/taxonomies'
import { useActionState } from 'react'
import { ActionButton } from '@/components/ui/action-button'

export const SyncAllButton = () => {
  const [state, formAction, pending] = useActionState(syncAll, undefined)

  return <ActionButton formAction={formAction} pending={pending} state={state} label={'Sync All from ATLAS'} />
}
