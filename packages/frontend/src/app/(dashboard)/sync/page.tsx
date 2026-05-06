'use client'

import useSWR from 'swr'
import { ArrowUpCircle, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Message } from '@/components/ui/message'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { SyncRecap } from '@/types'
import { apiFetcher, swrDefaultOptions } from '@/lib/swr'

export default function SyncPage() {
  const { data, error, isLoading } = useSWR<{
    data: SyncRecap
  }>('/api/sync/status', apiFetcher, swrDefaultOptions)
  const status = data?.data

  if (!status || isLoading) {
    return <>Loading...</>
  }

  return (
    <>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Sync Management</h2>
          <p className='text-muted-foreground'>Monitor and manage synchronization with ATLAS</p>
        </div>
      </div>
      {!status || error ? (
        <Message
          message={'Failed to load the sync status. Please check the backend logs'}
          success={false}
          duration={99}
        />
      ) : (
        <div className='mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Entities</CardTitle>
              <ArrowUpCircle className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{status.total}</div>
              <p className='text-xs text-muted-foreground'>All entities in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Synced</CardTitle>
              <CheckCircle2 className='h-4 w-4 text-green-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-green-600'>{status.synced}</div>
              <p className='text-xs text-muted-foreground'>
                {status.total > 0 ? Math.round((status.synced / status.total) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Pending</CardTitle>
              <Clock className='h-4 w-4 text-yellow-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-yellow-600'>{status.local}</div>
              <p className='text-xs text-muted-foreground'>Local only, not synced</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Issues</CardTitle>
              <AlertCircle className='h-4 w-4 text-red-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-red-600'>{status.conflict + status.failed}</div>
              <p className='text-xs text-muted-foreground'>
                {status.conflict} conflicts, {status.failed} failed
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
