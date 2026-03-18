import { UserDialogProps } from '@/components/settings/user-dialogs/types'
import { useActionState } from 'react'
import * as React from 'react'
import {
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialog,
} from '@/components/ui/alert-dialog'
import { deleteUser } from '@/app/actions/auth'

export const DeleteUserDialog = ({ open, user, onOpenChangeAction, onSuccessAction }: UserDialogProps) => {
  const [state, formAction, pending] = useActionState(deleteUser, undefined)

  React.useEffect(() => {
    if (state?.success === true) {
      onSuccessAction?.(state?.message)
      onOpenChangeAction(false)
    }
  }, [state, onOpenChangeAction, onSuccessAction])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChangeAction}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{user?.email}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {state?.success == false && state?.error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{state.error}</div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <form action={formAction}>
            <input type={'hidden'} name={'id'} defaultValue={user?.id} />
            <AlertDialogAction
              type={'submit'}
              disabled={pending || !user}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pending ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
