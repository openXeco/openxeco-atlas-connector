import type { EntityStatus, SyncStatus } from '@/types'
import { Badge } from '@/components/ui/badge'

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

type StatusBadgeProps =
  | {
      type: 'entity'
      status: EntityStatus
    }
  | {
      type: 'sync'
      status: SyncStatus
    }

export const StatusBadge = ({ type, status }: StatusBadgeProps) => {
  return (
    <Badge variant={'secondary'} className={type === 'entity' ? getStatusColor(status) : getSyncStatusColor(status)}>
      {status}
    </Badge>
  )
}
