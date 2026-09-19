'use client'

import type { EntitySync } from '@/types'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { columns } from '@/components/sync/sync-entities-table/columns'

export const SyncEntities = () => {
  const testEntities: EntitySync[] = [
    {
      id: 'test id 1',
      atlasId: 'test atlas_id 1',
      name: 'Test entity 1',
      syncStatus: 'synced',
      updatedAt: new Date(),
      lastSyncedAt: new Date(),
      atlasUpdatedAt: new Date(),
    },
    {
      id: 'test id 2',
      atlasId: 'test atlas_id 2',
      name: 'Test entity 2',
      syncStatus: 'pending_push',
      updatedAt: new Date(),
      lastSyncedAt: null,
    },
  ]

  return (
    <Card>
      <CardHeader>Entities</CardHeader>
      <CardContent>
        <DataTable columns={columns()} data={testEntities} />
      </CardContent>
    </Card>
  )
}
