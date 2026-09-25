'use client'

import { useActionState } from 'react'
import { ActionButton } from '@/components/ui/action-button'
import { deleteEntityFormAction } from '@/app/actions/entities'

export const DeleteEntityButton = ({ id }: { id: string }) => {
  const [state, formAction, pending] = useActionState(deleteEntityFormAction, undefined)

  return (
    <ActionButton
      formAction={formAction}
      pending={pending}
      state={state}
      label={'Delete'}
      hiddenFields={<input type={'hidden'} name={'id'} value={id} />}
      variant={'delete'}
      confirmMessage={'Are you sure you want to delete this entity?'}
    />
  )
}
