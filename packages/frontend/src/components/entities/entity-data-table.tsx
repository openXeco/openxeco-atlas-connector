'use client'

import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, Eye, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { Entity } from '@/types/entity'
import { useState } from 'react'

interface EntityDataTableProps {
  data: Entity[]
  loading?: boolean
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published':
      return 'bg-green-500/10 text-green-700 hover:bg-green-500/20'
    case 'ready_for_publication':
      return 'bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20'
    case 'to_be_rejected':
      return 'bg-orange-500/10 text-orange-700 hover:bg-orange-500/20'
    case 'draft':
      return 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20'
    case 'rejected':
      return 'bg-red-500/10 text-red-700 hover:bg-red-500/20'
    default:
      return 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20'
  }
}

const getSyncStatusColor = (syncStatus: string) => {
  switch (syncStatus) {
    case 'synced':
      return 'bg-green-500/10 text-green-700 hover:bg-green-500/20'
    case 'pending_push':
      return 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20'
    case 'local':
      return 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20'
    case 'failed':
      return 'bg-red-500/10 text-red-700 hover:bg-red-500/20'
    case 'conflict':
      return 'bg-orange-500/10 text-orange-700 hover:bg-orange-500/20'
    default:
      return 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20'
  }
}

export function EntityDataTable({ data, loading, onView, onEdit, onDelete }: EntityDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<Entity>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          return (
            <div className="flex flex-col">
              <span className="font-medium">{row.original.name}</span>
              {row.original.description && (
                <span className="text-sm text-muted-foreground line-clamp-1">{row.original.description}</span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          return (
            <Badge variant="secondary" className={getStatusColor(row.original.status)}>
              {row.original.status}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'syncStatus',
        header: 'Sync Status',
        cell: ({ row }) => {
          return (
            <Badge variant="secondary" className={getSyncStatusColor(row.original.syncStatus)}>
              {row.original.syncStatus.replace('_', ' ')}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              Updated
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          return new Date(row.original.updatedAt).toLocaleDateString()
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onView(row.original.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(row.original.id)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(row.original.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [onView, onEdit, onDelete]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading entities...</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <div className="text-muted-foreground">No entities found</div>
        <p className="text-sm text-muted-foreground">Create your first entity to get started</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
