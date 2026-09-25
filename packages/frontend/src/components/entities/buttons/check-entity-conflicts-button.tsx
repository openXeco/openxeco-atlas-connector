'use client'

import { ActionButton } from '@/components/ui/action-button'

type CheckEntityConflictsButtonProps = {
  id: string
  formAction: (formData: FormData) => void | Promise<void>
  pending: boolean
  label?: string
}

export const CheckEntityConflictsButton = ({
  id,
  formAction,
  pending,
  label = 'Check conflicts',
}: CheckEntityConflictsButtonProps) => (
  <ActionButton
    formAction={formAction}
    pending={pending}
    label={label}
    syncingLabel='Checking conflicts...'
    hiddenFields={
      <>
        <input type='hidden' name='id' value={id} />
        <input type='hidden' name='operation' value='check_conflicts' />
      </>
    }
    variant='refresh'
  />
)
