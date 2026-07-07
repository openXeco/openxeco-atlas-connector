'use client'

import { useActionState } from 'react'
import { ActionButton } from '@/components/ui/action-button'
import { checkConflicts } from '@/app/actions/entities'

export const CheckEntityConflictsButton = ({ id }: { id: string }) => {
  const [state, formAction, pending] = useActionState(checkConflicts, undefined)

  return (
    <ActionButton
      formAction={formAction}
      pending={pending}
      state={state}
      label={'Verify sync status'}
      hiddenFields={<input type={'hidden'} name={'id'} value={id} />}
      variant={'check'}
    />
  )
}
