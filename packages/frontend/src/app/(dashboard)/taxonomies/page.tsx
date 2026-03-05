'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { RefreshCw, Database, Clock, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'
import { apiFetcher } from '@/lib/swr'

import { TAXONOMY_TYPES } from '@/data/taxonomies'
import { TaxonomyType } from '@/types'

export default function TaxonomiesPage() {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<{
    data: { total: number; taxonomies: Record<TaxonomyType, number> }
  }>('/api/taxonomies/count', apiFetcher)

  const stats: Record<string, number> = data?.data.taxonomies ?? {}
  const total = data?.data.total ?? 0

  const handleSyncAll = async () => {
    setSyncing(true)

    try {
      await apiClient.post('/api/taxonomies/sync', {})
      mutate()
    } catch (_err) {
      // error shown via SWR
    } finally {
      setSyncing(false)
    }
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Taxonomies</h2>
          <p className="text-muted-foreground">Manage taxonomy terms from ATLAS API</p>
        </div>
        <Button onClick={handleSyncAll} disabled={syncing || isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync All from ATLAS'}
        </Button>
      </div>

      {error && <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">Failed to load taxonomy statistics</div>}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Types</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{TAXONOMY_TYPES.length}</div>
            <p className="text-xs text-muted-foreground">Taxonomy categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Terms</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Recently</div>
            <p className="text-xs text-muted-foreground">From ATLAS API</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TAXONOMY_TYPES.map((taxonomyType) => (
          <Card
            key={taxonomyType.type}
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={() => router.push(`/taxonomies/${taxonomyType.type}`)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{taxonomyType.label}</CardTitle>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription className="text-sm">{taxonomyType.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Terms:</span>
                <span className="text-lg font-semibold">
                  {isLoading ? '...' : (stats[taxonomyType.type] || 0).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
