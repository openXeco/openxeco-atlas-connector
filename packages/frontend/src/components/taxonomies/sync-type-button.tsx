'use client'

import { syncByType } from '@/app/actions/taxonomies'
import { useActionState, useEffect } from 'react'
import { TaxonomyType } from '@/types'
import { ActionButton } from '@/components/ui/action-button'
import { mutate } from 'swr'

export const SyncTypeButton = ({ type }: { type: TaxonomyType }) => {
  const [state, formAction, pending] = useActionState(syncByType, undefined)

  useEffect(() => {
    if (state?.success) {
      mutate(`/api/taxonomies/${type}`)
    }
  }, [state, mutate])

  return (
    <ActionButton
      pending={pending}
      formAction={formAction}
      state={state}
      hiddenFields={<input type="hidden" name="type" value={type} />}
    />
  )
}
