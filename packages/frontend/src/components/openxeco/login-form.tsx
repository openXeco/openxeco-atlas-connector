'use client'

import React, { useActionState } from 'react'
import { oxeLogin } from '@/app/actions/openxeco'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { mutate } from 'swr'
import { Message } from '@/components/ui/message'

export const OxeLoginForm = () => {
  const [state, formAction, pending] = useActionState(oxeLogin, undefined)
  const [error, setError] = React.useState<string>('')

  React.useEffect(() => {
    if (state?.success) {
      mutate('/api/openxeco')
      return
    }
  }, [state])

  React.useEffect(() => {
    if (state?.success === false && !state?.fieldErrors) {
      setError(state?.error || '')
    }
  }, [state])

  return (
    <form action={formAction}>
      <div className={'flex flex-col gap-4'}>
        {error && <Message message={error} success={false} duration={99} />}
        <Label className={'flex flex-col gap-4'} htmlFor='email'>
          Email
          <Input
            name='email'
            type='email'
            defaultValue={state?.email ?? ''}
            placeholder='user@openxeco.org'
            disabled={pending}
            required={true}
          />
        </Label>
        {!state?.success && state?.fieldErrors?.email && (
          <p className='text-sm text-destructive'>{state?.fieldErrors.email.join(' ')}</p>
        )}
        <Label className={'flex flex-col gap-2'} htmlFor='email'>
          Password
          <Input
            name='password'
            type='password'
            placeholder='Enter your openXeco password'
            disabled={pending}
            required={true}
          />
          {!state?.success && state?.fieldErrors?.password && (
            <p className='text-sm text-destructive'>{state?.fieldErrors.password.join(' ')}</p>
          )}
        </Label>

        <Button type='submit' className='w-full' disabled={pending}>
          {pending ? 'Signing in...' : 'Sign-in'}
        </Button>
      </div>
    </form>
  )
}
