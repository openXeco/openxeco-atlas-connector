'use client'

import useSWR from 'swr'
import { RefreshCw, CheckCircle2, AlertCircle, Clock, ArrowUpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SyncStatusWidget } from '@/components/sync/sync-status-widget'
import { SyncLogsTable } from '@/components/sync/sync-logs-table'
import { apiFetcher } from '@/lib/swr'

interface SyncStatus {
  total: number
  local: number
  synced: number
  conflict: number
  failed: number
  pendingPush: number
}

export default function SyncPage() {
  const { data, error, isLoading, mutate } = useSWR<{ data: SyncStatus }>('/api/sync/status', apiFetcher)

  const status = data?.data ?? null

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sync Management</h2>
          <p className="text-muted-foreground">Monitor and manage synchronization with ATLAS</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => mutate()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">Failed to load sync status</div>}

      {status && (
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.total}</div>
              <p className="text-xs text-muted-foreground">All entities in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Synced</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{status.synced}</div>
              <p className="text-xs text-muted-foreground">
                {status.total > 0 ? Math.round((status.synced / status.total) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{status.local}</div>
              <p className="text-xs text-muted-foreground">Local only, not synced</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issues</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{status.conflict + status.failed}</div>
              <p className="text-xs text-muted-foreground">
                {status.conflict} conflicts, {status.failed} failed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SyncStatusWidget onRefresh={() => mutate()} />
        </TabsContent>

        <TabsContent value="logs">
          <SyncLogsTable />
        </TabsContent>
      </Tabs>
    </>
  )
}
