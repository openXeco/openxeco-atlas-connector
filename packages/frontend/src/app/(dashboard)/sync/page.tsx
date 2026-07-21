import { SyncStatusWidgets } from '@/components/sync/sync-status-widgets'
import { SyncEntities } from '@/components/sync/sync-entities'

export default async function SyncPage() {
  return (
    <>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Sync Management</h2>
          <p className='text-muted-foreground'>Monitor and manage synchronization with ATLAS</p>
        </div>
      </div>
      <SyncStatusWidgets />
      <SyncEntities />
    </>
  )
}
