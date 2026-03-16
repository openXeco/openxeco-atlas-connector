'use client'

import { useActionState } from 'react'
import { ActionButton } from '@/components/ui/action-button'
import { syncEntity } from '@/app/actions/entities'

export const SyncEntityButton = ({ id }: { id: string }) => {
  const [state, formAction, pending] = useActionState(syncEntity, undefined)

  return (
    <ActionButton
      formAction={formAction}
      pending={pending}
      state={state}
      label={'Push to ATLAS'}
      hiddenFields={<input type={'hidden'} name={'id'} value={id} />}
      variant={'sync'}
    />
  )
}
