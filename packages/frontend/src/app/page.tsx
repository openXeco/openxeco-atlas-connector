'use client'

import { useState, useEffect } from 'react'
import { Building2, Tags, RefreshCw, AlertCircle } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { apiClient } from '@/lib/api'

interface SyncStatus {
  total: number
  local: number
  synced: number
  conflict: number
  failed: number
  pendingPush: number
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [entityTotal, setEntityTotal] = useState(0)
  const [taxonomyTotal, setTaxonomyTotal] = useState(0)
  const [pendingSync, setPendingSync] = useState(0)
  const [conflicts, setConflicts] = useState(0)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [syncRes, taxRes] = await Promise.all([
          apiClient.get<{ data: SyncStatus }>('/api/sync/status'),
          apiClient.get<{ data: { total: number } }>('/api/taxonomies/count'),
        ])

        setEntityTotal(syncRes.data.total)
        setPendingSync(syncRes.data.pendingPush)
        setConflicts(syncRes.data.conflict)
        setTaxonomyTotal(taxRes.data.total)
      } catch (_error) {
        // stats stay at 0 on failure
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const stats = [
    { name: 'Total Entities', value: entityTotal, icon: Building2, color: 'text-blue-600' },
    { name: 'Taxonomies', value: taxonomyTotal, icon: Tags, color: 'text-green-600' },
    { name: 'Pending Sync', value: pendingSync, icon: RefreshCw, color: 'text-orange-600' },
    { name: 'Conflicts', value: conflicts, icon: AlertCircle, color: 'text-red-600' },
  ]

  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-auto bg-muted/30 p-6">
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
                    <div className="text-3xl font-bold">
                      {loading ? '...' : stat.value.toLocaleString()}
                    </div>
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
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
