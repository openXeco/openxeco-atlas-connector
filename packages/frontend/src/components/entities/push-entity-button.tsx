'use client'

import { useActionState } from 'react'
import { ActionButton } from '@/components/ui/action-button'
import { pushEntity } from '@/app/actions/entities'

export const PushEntityButton = ({ id }: { id: string }) => {
  const [state, formAction, pending] = useActionState(pushEntity, undefined)

  return (
    <ActionButton
      formAction={formAction}
      pending={pending}
      state={state}
      label={'Push to ATLAS'}
      hiddenFields={<input type={'hidden'} name={'id'} value={id} />}
      variant={'push'}
    />
  )
}
