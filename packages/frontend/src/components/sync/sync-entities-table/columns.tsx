import type { ColumnDef } from '@tanstack/react-table'
import type { EntitySync } from '@/types'
import { StatusBadge } from '@/components/entities/status-badge'
import { formatDate } from '@/lib/utils'

export const columns = (): ColumnDef<EntitySync>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const { atlasId } = row.original

      return (
        <div className='flex flex-col'>
          <div>{row.getValue('name')}</div>
          {atlasId && <div>{atlasId}</div>}
        </div>
      )
    },
  },
  {
    accessorKey: 'syncStatus',
    header: 'Sync Status',
    cell: ({ row }) => {
      return <StatusBadge type={'sync'} status={row.getValue('syncStatus')} />
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Dates',
    cell: ({ row }) => {
      const { lastSyncedAt, atlasUpdatedAt } = row.original

      console.log(row)
      return (
        <div className={'flex flex-col'}>
          <div>Updated at: {formatDate(row.getValue('updatedAt'), true)}</div>
          {lastSyncedAt && <div>Last synced at {formatDate(lastSyncedAt.toString(), true)}</div>}
          {atlasUpdatedAt && <div>Atlas last updated at {formatDate(atlasUpdatedAt.toString(), true)}</div>}
        </div>
      )
    },
  },
]
