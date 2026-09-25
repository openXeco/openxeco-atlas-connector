'use client'

import useSWR from 'swr'
import type { SyncRecap } from '@/types'
import { apiFetcher, swrDefaultOptions } from '@/lib/swr'
import { Message } from '@/components/ui/message'
import { ArrowUpCircle, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { type FullCardProps, FullCard } from '@/components/ui/full-card'

export const SyncStatusWidgets = () => {
  const { data, error, isLoading } = useSWR<{
    data: SyncRecap
  }>('/api/sync/status', apiFetcher, swrDefaultOptions)

  const status = data?.data
  const synced = Number(status?.sync?.synced ?? 0)
  const pendingPush = Number(status?.sync?.pending_push ?? 0)
  const failed = Number(status?.sync?.failed ?? 0)

  if (!status || isLoading) {
    return <>Loading...</>
  }

  const cards: FullCardProps[] = [
    {
      variant: 'info',
      title: 'Total Entities',
      Icon: ArrowUpCircle,
      value: status.total,
    },
    {
      variant: 'success',
      title: 'Synced',
      Icon: CheckCircle2,
      value: synced,
      description: status.total > 0 ? `${Math.round((synced / status.total) * 100)}% of total` : '',
    },
    {
      variant: 'warning',
      title: 'Pending',
      Icon: Clock,
      value: pendingPush,
      description: status.total > 0 ? `${Math.round((pendingPush / status.total) * 100)}% of total` : '',
    },
    {
      variant: 'danger',
      title: 'Failed',
      Icon: AlertCircle,
      value: failed,
      description: status.total > 0 ? `${Math.round((failed / status.total) * 100)}% of total` : '',
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
