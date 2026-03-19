'use client'

import { syncAll } from '@/app/actions/taxonomies'
import { useActionState, useEffect } from 'react'
import { ActionButton } from '@/components/ui/action-button'
import { mutate } from 'swr'

export const SyncAllButton = () => {
  const [state, formAction, pending] = useActionState(syncAll, undefined)

  useEffect(() => {
    if (state?.success) {
      mutate(`/api/taxonomies`)
    }
  }, [state, mutate])

  return <ActionButton formAction={formAction} pending={pending} state={state} label={'Sync All from ATLAS'} />
}
