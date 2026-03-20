import type { User } from '@/types'

export type UserDialogProps = {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  user: User | null
  // biome-ignore lint/suspicious/noExplicitAny: Fine here
  onSuccessAction?: (...args: any[]) => void
}
