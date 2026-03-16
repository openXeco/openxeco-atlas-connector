import type { User } from '@/types'

export type UserDialogProps = {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  user: User | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccessAction?: (...args: any[]) => void
}
