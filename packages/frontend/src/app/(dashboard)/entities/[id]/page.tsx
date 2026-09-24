'use client'

import type { Entity, SyncLog } from '@/types'
import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DeleteEntityButton } from '@/components/entities/buttons/delete-entity-button'
import { Link } from '@/components/ui/link'
import { EditEntityButton } from '@/components/entities/buttons/edit-entity-button'
import { StatusBadge } from '@/components/entities/status-badge'
import useSWR from 'swr'
import { apiFetcher } from '@/lib/swr'
import { ViewEntity } from '@/components/entities/view-entity'
import { SyncEntity } from '@/components/entities/sync-entity'

export default function ViewEntityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)

  const { data, isLoading } = useSWR<{ data: { entity: Entity } }>(`/api/entities/${id}`, apiFetcher)
  const { data: logsData, isLoading: isLogsLoading } = useSWR<{ data: SyncLog[] }>(
    `/api/sync/logs?entityId=${id}`,
    apiFetcher,
  )

  const { entity } = data?.data || {}
  const logs = logsData?.data || []

  if (isLoading || isLogsLoading) {
    return <>Loading...</>
  }

  if (!entity) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold'>Entity not found</h2>
          <Link href={'/entities'} variant='ghost'>
            Back to Entities
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className='mb-6 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link href={'/entities'} variant={'ghost'}>
            <ArrowLeft className={'h-5 w-5'} />
          </Link>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>{entity.name}</h2>
            <div className='mt-1 flex items-center gap-2'>
              <StatusBadge type={'entity'} status={entity.status} />
            </div>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <EditEntityButton id={id} />
          <DeleteEntityButton id={id} />
        </div>
      </div>

      <Tabs defaultValue='details' className='space-y-6'>
        <TabsList>
          <TabsTrigger value='details'>Details</TabsTrigger>
          <TabsTrigger value={'sync'} disabled={false}>
            Sync
          </TabsTrigger>
        </TabsList>

        <TabsContent value='details' className='space-y-6'>
          <ViewEntity entity={entity} />
        </TabsContent>
        <TabsContent value={'sync'}>
          <SyncEntity entity={entity} logs={logs} />
        </TabsContent>
      </Tabs>
    </>
  )
}
