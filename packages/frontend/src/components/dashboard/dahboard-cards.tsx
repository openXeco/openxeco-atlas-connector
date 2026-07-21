'use client'

import { apiFetcher, swrDefaultOptions } from '@/lib/swr'
import useSWR from 'swr'
import type { SyncRecap } from '@/types'
import { Building2, RefreshCw, AlertCircle, Tags } from 'lucide-react'
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

  const entityTotal = syncData?.data.total ?? 0
  const pendingSync = syncData?.data.pendingPush ?? 0
  const conflicts = syncData?.data.conflict ?? 0
  const taxonomyTotal = taxData?.data.total ?? 0

  const stats: (FullCardProps & { value: number })[] = [
    {
      title: 'Total Entities',
      value: entityTotal,
      Icon: Building2,
      variant: 'info',
    },
    {
      title: 'Taxonomies',
      value: taxonomyTotal,
      Icon: Tags,
      variant: 'success',
    },
    {
      title: 'Pending Sync',
      value: pendingSync,
      Icon: RefreshCw,
      variant: 'warning',
    },
    {
      title: 'Conflicts',
      value: conflicts,
      Icon: AlertCircle,
      variant: 'danger',
    },
  ]

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {stats.map((stat) => (
        <FullCard
          key={stat.title}
          title={stat.title}
          Icon={stat.Icon}
          variant={stat.variant}
          titleColor={stat.titleColor}
          contentColor={stat.contentColor}
          iconColor={stat.iconColor}
        >
          <div className='text-3xl font-bold'>{stat.value.toLocaleString()}</div>
        </FullCard>
      ))}
    </div>
  )
}
