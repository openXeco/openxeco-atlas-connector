'use client'

import * as React from 'react'
import { useActionState, useState } from 'react'
import { createUser, updateUser } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { UserDialogProps } from '@/components/settings/user-dialogs/types'
import { Message } from '@/components/ui/message'

export const ManageUserDialog = ({ open, user, onOpenChangeAction, onSuccessAction }: UserDialogProps) => {
  const isEditing = !!user

  const [state, formAction, pending] = useActionState(isEditing ? updateUser : createUser, undefined)
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
      <DialogContent className="sm:max-w-[425px]">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit User' : 'Add User'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the user email address.' : 'Create a new user account.'}
            </DialogDescription>
          </DialogHeader>

          {isEditing && <input type={'hidden'} name={'id'} defaultValue={user?.id} />}

          {error && <Message message={error} success={false} duration={99} />}

          <div className="grid py-4">
            <Label className={'flex flex-col gap-2'}>
              Email
              <Input
                name="email"
                type="email"
                defaultValue={state?.email ?? user?.email ?? ''}
                placeholder="user@example.com"
                disabled={pending}
              />
            </Label>

            {state?.success === false && state?.fieldErrors?.email && (
              <p className="text-sm text-destructive">{state.fieldErrors.email.join(' ')}</p>
            )}
          </div>

          {!isEditing && (
            <>
              <div className="grid py-4">
                <Label className={'flex flex-col gap-2'}>
                  Password
                  <Input name="password" type="password" placeholder="Minimum 8 characters" disabled={pending} />
                </Label>

                {state?.success === false && state?.fieldErrors?.password && (
                  <p className="text-sm text-destructive">{state.fieldErrors.password.join(' ')}</p>
                )}
              </div>

              <div className="grid py-4">
                <Label className={'flex flex-col gap-2'}>
                  Confirm Password
                  <Input name="confirmPassword" type="password" placeholder="Confirm password" disabled={pending} />
                </Label>

                {state?.success === false && state?.fieldErrors?.confirmPassword && (
                  <p className="text-sm text-destructive">{state.fieldErrors.confirmPassword.join(' ')}</p>
                )}
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChangeAction(false)} disabled={pending}>
              Cancel
            </Button>

            <Button type="submit" disabled={pending}>
              {isEditing ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
