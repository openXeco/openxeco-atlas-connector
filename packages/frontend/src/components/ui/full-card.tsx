import type { LucideIcon } from 'lucide-react'
import type React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type FullCardProps = React.PropsWithChildren<{
  title: string
  value?: number | string
  Icon: LucideIcon
  description?: string
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'default' | 'clickable'
  className?: string
  onClick?: () => void
}>

const iconVariantClasses: Record<NonNullable<FullCardProps['variant']>, string> = {
  default: 'bg-muted text-muted-foreground',
  info: 'bg-blue-500/10 text-blue-600',
  success: 'bg-green-500/10 text-green-600',
  warning: 'bg-yellow-500/10 text-yellow-700',
  danger: 'bg-red-500/10 text-red-600',
  clickable: 'text-muted-foreground',
} as const

export const FullCard = ({
  title,
  value,
  Icon,
  description,
  variant = 'default',
  className,
  children,
  onClick,
}: FullCardProps) => {
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value

  return (
    <Card onClick={onClick} className={cn('overflow-hidden', className)}>
      <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0 pb-4'>
        <div className='min-w-0 space-y-1'>
          <CardTitle className='text-base font-medium text-foreground'>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <div className={cn('shrink-0 rounded-lg p-2', iconVariantClasses[variant])}>
          <Icon aria-hidden='true' className='size-5' />
        </div>
      </CardHeader>

      <CardContent>
        <div
          className={`${variant === 'clickable' ? 'text-base text-accent-foreground' : 'text-3xl font-bold tracking-tight tabular-nums'} `}
        >
          {formattedValue}
        </div>
        {children ? <div className='mt-5 border-t pt-4 text-sm text-foreground'>{children}</div> : null}
      </CardContent>
    </Card>
  )
}
