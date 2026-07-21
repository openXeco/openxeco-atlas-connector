import type { LucideIcon } from 'lucide-react'
import type React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type FullCardProps = React.PropsWithChildren<{
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'default'
  title: string
  Icon: LucideIcon
  iconColor?: string
  titleColor?: string
  contentColor?: string
  onClick?: () => void
  className?: string
}>

const variantsMap = {
  default: 'text-muted-foreground',
  info: 'text-blue-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  danger: 'text-red-600',
}

export const FullCard = ({
  variant = 'default',
  title,
  iconColor,
  titleColor,
  contentColor,
  Icon,
  children,
  onClick,
  className,
}: FullCardProps) => {
  return (
    <Card onClick={onClick} className={className}>
      <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
        <CardTitle className={`text-base ${cn('text-foreground', titleColor)}`}>{title}</CardTitle>
        <Icon className={`h-5 w-5 ${cn(variantsMap[variant], iconColor)}`} />
      </CardHeader>
      <CardContent className={`${cn('text-foreground', contentColor)}`}>{children}</CardContent>
    </Card>
  )
}
