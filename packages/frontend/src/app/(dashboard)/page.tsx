'use client'

import useSWR from 'swr'
import { Building2, Tags, RefreshCw, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiFetcher } from '@/lib/swr'

interface SyncStatus {
  total: number
  local: number
  synced: number
  conflict: number
  failed: number
  pendingPush: number
}

export default function DashboardPage() {
  const { data: syncData, isLoading: syncLoading } = useSWR<{ data: SyncStatus }>('/api/sync/status', apiFetcher)
  const { data: taxData, isLoading: taxLoading } = useSWR<{ data: { total: number } }>('/api/taxonomies/count', apiFetcher)

  const loading = syncLoading || taxLoading
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
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your ATLAS Connector status</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? '...' : stat.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent activity to display.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Connect to ATLAS to view sync status.</p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
