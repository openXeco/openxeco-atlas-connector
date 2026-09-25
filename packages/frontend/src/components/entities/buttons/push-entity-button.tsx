'use client'

import { ActionButton } from '@/components/ui/action-button'

export const PushEntityButton = ({
  id,
  formAction,
  pending,
}: {
  id: string
  formAction: (formData: FormData) => void | Promise<void>
  pending: boolean
}) => {
  return (
    <ActionButton
      formAction={formAction}
      pending={pending}
      label={'Push to ATLAS'}
      hiddenFields={
        <>
          <input type='hidden' name='id' value={id} />
          <input type='hidden' name='operation' value='push' />
        </>
      }
      variant={'push'}
    />
  )
}
