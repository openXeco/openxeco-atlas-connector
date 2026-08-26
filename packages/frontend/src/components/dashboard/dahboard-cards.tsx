'use client'

import { apiFetcher, swrDefaultOptions } from '@/lib/swr'
import useSWR from 'swr'
import type { EntityStatus, SyncRecap, SyncStatus } from '@/types'
import { Building2, AlertCircle, Tags } from 'lucide-react'
import { TAXONOMY_TYPES } from '@/data/taxonomies'
import type React from 'react'
import { MODERATION_STATUS_LABELS, SYNC_STATUS_LABELS } from '@/lib/constants'
import { FullCard, type FullCardProps } from '@/components/ui/full-card'

export const DashboardCards = () => {
  const {
    data: syncData,
    isLoading: syncLoading,
    error: syncError,
  } = useSWR<{ data: SyncRecap }>('/api/sync/status', apiFetcher, swrDefaultOptions)
  const {
    data: taxData,
    isLoading: taxLoading,
    error: taxError,
  } = useSWR<{ data: { total: number } }>('/api/taxonomies/count', apiFetcher, swrDefaultOptions)

  const isLoading = syncLoading || taxLoading

  if (isLoading) {
    return <>Loading...</>
  }

  if (syncError || taxError) {
    return (
      <div className='flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive'>
        <AlertCircle className='h-4 w-4' />
        <span>There was an error while loading the statistics. Please check the logs.</span>
      </div>
    )
  }

  const stats: (FullCardProps & { text?: React.ReactNode })[] = [
    {
      title: 'Total Entities',
      value: syncData?.data.total ?? 0,
      Icon: Building2,
      variant: 'info',
      text: (
        <div>
          <div className={'font-bold text-base mb-2'}>Moderation State</div>
          <ul className={'flex flex-col gap-1'}>
            {Object.entries(syncData?.data.moderation ?? {}).map(([status, count]) =>
              count > 0 ? (
                <li key={status}>
                  {MODERATION_STATUS_LABELS[status as EntityStatus]}: <strong>{count}</strong>
                </li>
              ) : null,
            )}
          </ul>

          <div className={'font-bold text-base my-2'}>Sync Status</div>
          <ul className={'flex flex-col gap-1'}>
            {Object.entries(syncData?.data.sync ?? {}).map(([status, count]) =>
              count > 0 ? (
                <li key={status}>
                  {SYNC_STATUS_LABELS[status as SyncStatus]}: <strong>{count}</strong>
                </li>
              ) : null,
            )}
          </ul>
        </div>
      ),
    },
    {
      title: 'Taxonomies',
      value: TAXONOMY_TYPES.length,
      Icon: Tags,
      variant: 'success',
      text: `Total terms: ${taxData?.data.total ?? 0}`,
      description: 'Total taxonomy types.',
    },
  ]

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {stats.map((stat) => (
        <FullCard key={stat.title} title={stat.title} Icon={stat.Icon} variant={stat.variant} value={stat.value ?? 0}>
          {stat.text ? <div className={'text-sm text-foreground mt-2'}>{stat.text}</div> : undefined}
        </FullCard>
      ))}
    </div>
  )
}
