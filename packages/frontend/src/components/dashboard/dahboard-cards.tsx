'use client'

import { apiFetcher } from '@/lib/swr'
import useSWR from 'swr'
import type { SyncRecap } from '@/types'
import { Building2, RefreshCw, AlertCircle, Tags } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const DashboardCards = () => {
  const {
    data: syncData,
    isLoading: syncLoading,
    error: syncError,
  } = useSWR<{ data: SyncRecap }>('/api/sync/status', apiFetcher)
  const { data: taxData, isLoading: taxLoading, error: taxError } = useSWR<{ data: { total: number } }>(
    '/api/taxonomies/count',
    apiFetcher
  )

  const isLoading = syncLoading || taxLoading

  if (isLoading) {
    return undefined
  }

  if (syncError || taxError) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span>There was an error while loading the statistics. Please check the logs.</span>
      </div>
    )
  }

  const entityTotal = syncData?.data.total ?? 0
  const pendingSync = syncData?.data.pendingPush ?? 0
  const conflicts = syncData?.data.conflict ?? 0
  const taxonomyTotal = taxData?.data.total ?? 0

  const stats = [
    { name: 'Total Entities', value: entityTotal, icon: Building2, color: 'text-blue-600' },
    { name: 'Taxonomies', value: taxonomyTotal, icon: Tags, color: 'text-green-600' },
    { name: 'Pending Sync', value: pendingSync, icon: RefreshCw, color: 'text-orange-600' },
    { name: 'Conflicts', value: conflicts, icon: AlertCircle, color: 'text-red-600' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
