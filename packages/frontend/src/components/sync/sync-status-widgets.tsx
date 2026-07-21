'use client'

import useSWR from 'swr'
import type { SyncRecap } from '@/types'
import { type FullCardProps, FullCard } from '@/components/ui/full-card'
import { apiFetcher, swrDefaultOptions } from '@/lib/swr'
import { Message } from '@/components/ui/message'
import { ArrowUpCircle, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export const SyncStatusWidgets = () => {
  const { data, error, isLoading } = useSWR<{
    data: SyncRecap
  }>('/api/sync/status', apiFetcher, swrDefaultOptions)

  const status = data?.data

  if (!status || isLoading) {
    return <>Loading...</>
  }

  const cards: FullCardProps[] = [
    {
      variant: 'info',
      title: 'Total Entities',
      Icon: ArrowUpCircle,
      children: (
        <>
          <div className='text-2xl font-bold'>{status.total}</div>
          <p className='text-xs text-muted-foreground'>All entities in system</p>
        </>
      ),
    },
    {
      variant: 'success',
      title: 'Synced',
      Icon: CheckCircle2,
      children: (
        <>
          <div className='text-2xl font-bold text-green-600'>{status.synced}</div>
          <p className='text-xs text-muted-foreground'>
            {status.total > 0 ? Math.round((status.synced / status.total) * 100) : 0}% of total
          </p>
        </>
      ),
    },
    {
      variant: 'warning',
      title: 'Pending',
      Icon: Clock,
      children: (
        <>
          <div className='text-2xl font-bold text-yellow-600'>{status.local}</div>
          <p className='text-xs text-muted-foreground'>Local only, not synced</p>
        </>
      ),
    },
    {
      variant: 'danger',
      title: 'Issues',
      Icon: AlertCircle,
      children: (
        <>
          <div className='text-2xl font-bold text-red-600'>{status.conflict + status.failed}</div>
          <p className='text-xs text-muted-foreground'>
            {status.conflict} conflicts, {status.failed} failed
          </p>
        </>
      ),
    },
  ]

  return (
    <>
      {!status || error ? (
        <Message
          message={'Failed to load the sync status. Please check the backend logs'}
          success={false}
          duration={99}
        />
      ) : (
        <div className='mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {cards.map((cardProps) => {
            return <FullCard key={cardProps.title} {...cardProps} />
          })}
        </div>
      )}
    </>
  )
}
