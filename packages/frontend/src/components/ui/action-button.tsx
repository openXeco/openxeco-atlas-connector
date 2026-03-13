'use client'

import React from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { RefreshCw, Trash2, AlertCircle, LucideIcon } from 'lucide-react'
import { Message } from '@/components/ui/message'
import { ActionState } from '@/types'

type ActionButtonVariant = 'sync' | 'delete' | 'refresh' | 'alert'

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
}: Pick<ActionButtonProps, 'label' | 'syncingLabel' | 'confirmMessage' | 'variant'>): Pick<ActionButtonProps, 'label' | 'syncingLabel' | 'confirmMessage' > & {
  Icon: LucideIcon
  buttonVariant?: ButtonProps['variant']
  className: string
  buttonClassName?: string
} => {
  switch (variant) {
    case 'sync':
      return {
        label: label || 'Sync',
        syncingLabel: syncingLabel || 'Syncing...',
        Icon: RefreshCw,
        className: 'gap-2 max-w-max',
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
      }

    case 'refresh':
      return {
        label: label || 'Refresh',
        syncingLabel: syncingLabel || 'Refreshing...',
        Icon: RefreshCw,
        buttonVariant: 'outline',
        className: 'gap-2 max-w-max',
      }

    default:
      return {
        label: 'Test',
        syncingLabel: syncingLabel || 'Testing...',
        Icon: AlertCircle,
        buttonVariant: 'outline',
        className: 'gap-2 max-w-max',
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

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (
    e
  ) => {
    if (variant === 'delete' && !confirm(uiProps.confirmMessage || '')) {
      return
    }

    if (formAction) {
      e.currentTarget.form?.requestSubmit(e.currentTarget)
    }
  }

  return (
    <form action={formAction} className="flex flex-col items-end">
      {hiddenFields}

      <Button
        type={"submit"}
        onClick={handleClick}
        disabled={pending}
        className={`gap-2 max-w-max ${uiProps.buttonClassName}`}
        variant={uiProps.buttonVariant}
      >
        <uiProps.Icon className={`${uiProps.className} ${pending ? 'animate-spin' : ''}`} />
        {!hideLabel ? (pending ? uiProps.syncingLabel : uiProps.label) : undefined}
      </Button>

      {state?.success !== undefined && !pending && (
        <Message message={(state.success ? state.message : state.error) || ''} success={state.success} duration={5} />
      )}
    </form>
  )
}
