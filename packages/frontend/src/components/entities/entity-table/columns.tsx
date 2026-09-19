'use client'

import type { Entity } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'
import { StatusBadge } from '@/components/entities/status-badge'
import { formatDate } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'

export const columns = ({
  onViewAction,
  onEditAction,
  onDeleteAction,
}: {
  onViewAction: (id: string) => void
  onEditAction: (id: string) => void
  onDeleteAction: (id: string) => void
}): ColumnDef<Entity>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      return (
        <div className='flex flex-col'>
          <Link href={`/entities/${row.original.id}`} variant={'link'} className={'justify-start max-w-min'}>
            {row.getValue('name')}
          </Link>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Moderation State',
    cell: ({ row }) => {
      return <StatusBadge type={'entity'} status={row.getValue('status')} />
    },
  },
  {
    accessorKey: 'syncStatus',
    header: 'Sync Status',
    cell: ({ row }) => {
      return <StatusBadge type={'sync'} status={row.getValue('syncStatus')} code={row.original.syncCode} />
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    cell: ({ row }) => {
      return formatDate(row.getValue('updatedAt'), true)
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const entity = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild={true}>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onViewAction(entity.id)}>
              <Eye className='mr-2 h-4 w-4' />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditAction(entity.id)}>
              <Pencil className='mr-2 h-4 w-4' />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDeleteAction(entity.id)} className='text-destructive'>
              <Trash2 className='mr-2 h-4 w-4' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
