import { forwardRef } from 'react'
import { Pencil } from 'lucide-react'
import { Link, type LinkProps } from '@/components/ui/link'

type EditButtonProps = { id: string } & Omit<LinkProps, 'href'>

export const EditEntityButton = forwardRef<HTMLAnchorElement, EditButtonProps>(
  ({ id, variant = 'outline', ...props }, ref) => (
    <Link href={`/entities/${id}/edit`} variant={variant} {...props} ref={ref}>
      <Pencil className='h-4 w-4' />
      Edit
    </Link>
  ),
)

EditEntityButton.displayName = 'EditEntityButton'
