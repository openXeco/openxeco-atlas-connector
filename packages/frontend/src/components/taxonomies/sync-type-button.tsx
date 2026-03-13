'use client'

import { syncByType } from '@/app/actions/taxonomies'
import { useActionState } from 'react'
import { TaxonomyType } from '@/types'
import { ActionButton } from '@/components/ui/action-button'

export const SyncTypeButton = ({ type }: { type: TaxonomyType }) => {
  const [state, formAction, pending] = useActionState(syncByType, undefined)

  return (
    <ActionButton
      pending={pending}
      formAction={formAction}
      state={state}
      hiddenFields={<input type="hidden" name="type" value={type} />}
    />
  )
}
