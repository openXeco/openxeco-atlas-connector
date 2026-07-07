'use client'

import type React from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { RefreshCw, Trash2, AlertCircle, type LucideIcon, DatabaseArrowUp } from 'lucide-react'
import { Message } from '@/components/ui/message'
import type { ActionState } from '@/types'

type ActionButtonVariant = 'sync' | 'delete' | 'refresh' | 'alert' | 'push' | 'pull' | 'check'

type ActionButtonProps = {
  variant?: ActionButtonVariant
  hideLabel?: boolean
  label?: string
  syncingLabel?: string
  confirmMessage?: string
  formAction?: (formData: FormData) => void | Promise<void>
  pending: boolean
  state?: ActionState
  hiddenFields?: React.ReactNode
}

const getDefaultUI = ({
  variant,
  label,
  syncingLabel,
}: Pick<ActionButtonProps, 'label' | 'syncingLabel' | 'confirmMessage' | 'variant'>): Pick<
  ActionButtonProps,
  'label' | 'syncingLabel' | 'confirmMessage'
> & {
  Icon: LucideIcon
  buttonVariant?: ButtonProps['variant']
  className: string
  buttonClassName?: string
  animation: string
  hideStatusMessage?: boolean
} => {
  switch (variant) {
    case 'sync':
      return {
        label: label || 'Sync',
        syncingLabel: syncingLabel || 'Syncing...',
        Icon: RefreshCw,
        className: 'gap-2 max-w-max',
        animation: 'animate-spin',
      }

    case 'check':
      return {
        label: label || 'Check',
        syncingLabel: syncingLabel || 'Checking...',
        Icon: RefreshCw,
        className: 'gap-2 max-w-max',
        buttonVariant: 'ghost',
        animation: 'animate-spin',
        hideStatusMessage: true,
      }

    case 'delete':
      return {
        label: label || 'Delete',
        syncingLabel: syncingLabel || 'Deleting...',
        Icon: Trash2,
        buttonVariant: 'outline',
        className: 'gap-2 max-w-max text-destructive hover:bg-destructive/10',
        buttonClassName: 'text-destructive hover:bg-destructive/10',
        confirmMessage: 'Are you sure?',
        animation: 'animate-spin',
      }

    case 'refresh':
      return {
        label: label || 'Refresh',
        syncingLabel: syncingLabel || 'Refreshing...',
        Icon: RefreshCw,
        buttonVariant: 'outline',
        className: 'gap-2 max-w-max',
        animation: 'animate-spin',
      }

    case 'push':
      return {
        label: label || 'Push}',
        syncingLabel: syncingLabel || 'Pushing...',
        Icon: DatabaseArrowUp,
        className: 'gap-2 max-w-max',
        animation: 'animate-pulse',
      }

    default:
      return {
        label: 'Test',
        syncingLabel: syncingLabel || 'Testing...',
        Icon: AlertCircle,
        buttonVariant: 'outline',
        className: 'gap-2 max-w-max',
        animation: 'animate-spin',
      }
  }
}

export function ActionButton({
  variant = 'sync',
  hideLabel = false,
  label,
  syncingLabel,
  formAction,
  pending,
  state,
  hiddenFields,
}: ActionButtonProps) {
  const uiProps = getDefaultUI({ variant, label, syncingLabel })

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()

    if (variant === 'delete' && !confirm(uiProps.confirmMessage || '')) {
      return
    }

    if (formAction) {
      e.currentTarget.form?.requestSubmit(e.currentTarget)
    }
  }

  return (
    <form action={formAction} className='flex flex-col items-end'>
      {hiddenFields}

      <Button
        type={'submit'}
        onClick={handleClick}
        disabled={pending}
        className={`gap-2 max-w-max ${uiProps.buttonClassName}`}
        variant={uiProps.buttonVariant}
      >
        <uiProps.Icon className={`${uiProps.className} ${pending ? uiProps.animation : ''}`} />
        {!hideLabel ? (pending ? uiProps.syncingLabel : uiProps.label) : undefined}
      </Button>

      {state?.success !== undefined && !pending && !uiProps.hideStatusMessage && (
        <Message message={(state.success ? state.message : state.error) || ''} success={state.success} duration={5} />
      )}
    </form>
  )
}
