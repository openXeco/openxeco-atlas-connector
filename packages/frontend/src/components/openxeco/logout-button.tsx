'use client'

import { oxeLogout } from '@/app/actions/openxeco'
import { ActionButton } from '@/components/ui/action-button'
import { mutate } from 'swr'
import React from 'react'

export const OxeLogoutButton = () => {
  const [state, formAction, pending] = React.useActionState(oxeLogout, undefined)

  React.useEffect(() => {
    if (state?.success) {
      mutate('/api/openxeco')
    }
  }, [state])

  return <ActionButton formAction={formAction} pending={pending} state={state} label={'Logout'} variant={'logout'} />
}
