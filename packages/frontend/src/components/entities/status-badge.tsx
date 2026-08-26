import type { EntityStatus, SyncStatus, SyncCode } from '@/types'
import { Badge } from '@/components/ui/badge'
import { MODERATION_STATUS_LABELS, SYNC_STATUS_LABELS } from '@/lib/constants'

const getStatusColor = (status: EntityStatus) => {
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
    case 'revision_requested':
      return 'bg-purple-500/10 text-gray-700 hover:bg-purple-500/20'
    default:
      return 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20'
  }
}

const getSyncStatusColor = (syncStatus: SyncStatus) => {
  switch (syncStatus) {
    case 'synced':
      return 'bg-green-500/10 text-green-700 hover:bg-green-500/20'
    case 'pending_push':
      return 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20'
    case 'failed':
      return 'bg-red-500/10 text-red-700 hover:bg-red-500/20'
    default:
      return 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20'
  }
}

type StatusBadgeProps =
  | {
      type: 'entity'
      status: EntityStatus
      code?: never
    }
  | {
      type: 'sync'
      status: SyncStatus
      code?: SyncCode | null
    }

export const StatusBadge = ({ type, status, code }: StatusBadgeProps) => {
  return (
    <Badge variant={'secondary'} className={type === 'entity' ? getStatusColor(status) : getSyncStatusColor(status)}>
      {type === 'entity' ? MODERATION_STATUS_LABELS[status] : SYNC_STATUS_LABELS[status]}
      {code && ` - ${code}`}
    </Badge>
  )
}
