'use client'

import type { UserDialogProps } from '@/components/settings/user-dialogs/types'
import { useActionState, useState } from 'react'
import { changePassword } from '@/app/actions/auth'
import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Message } from '@/components/ui/message'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const ChangePasswordDialog = ({ open, user, onOpenChangeAction, onSuccessAction }: UserDialogProps) => {
  const [state, formAction, pending] = useActionState(changePassword, undefined)
  const [error, setError] = useState<string>('')

  React.useEffect(() => {
    if (state?.success) {
      onSuccessAction?.(state?.message)
      onOpenChangeAction(false)
    }
  }, [state, onOpenChangeAction, onSuccessAction])

  React.useEffect(() => {
    if (state?.success === false && !state?.fieldErrors) {
      setError(state?.error || '')
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className='sm:max-w-[425px]'>
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Change user password</DialogTitle>
            <DialogDescription>User: {user?.email}</DialogDescription>
          </DialogHeader>

          <input type={'hidden'} name={'id'} defaultValue={user?.id} />

          {error && <Message message={error} success={false} duration={99} />}

          <div className='grid py-4'>
            <Label className={'flex flex-col gap-2'}>
              Password
              <Input name='password' type='password' placeholder='Minimum 8 characters' disabled={pending} />
            </Label>

            {state?.success === false && state?.fieldErrors?.password && (
              <p className='text-sm text-destructive'>{state.fieldErrors.password.join(' ')}</p>
            )}
          </div>

          <div className='grid py-4'>
            <Label className={'flex flex-col gap-2'}>
              Confirm Password
              <Input name='confirmPassword' type='password' placeholder='Confirm password' disabled={pending} />
            </Label>

            {state?.success === false && state?.fieldErrors?.confirmPassword && (
              <p className='text-sm text-destructive'>{state.fieldErrors.confirmPassword.join(' ')}</p>
            )}
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChangeAction(false)} disabled={pending}>
              Cancel
            </Button>

            <Button type='submit' disabled={pending || !user}>
              Change password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
