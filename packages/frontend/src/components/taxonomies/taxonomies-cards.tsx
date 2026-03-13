'use client'

import useSWR from 'swr'
import { TaxonomyType } from '@/types'
import { apiFetcher } from '@/lib/swr'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Database, Clock, ChevronRight } from 'lucide-react'
import { TAXONOMY_TYPES } from '@/data/taxonomies'
import { useRouter } from 'next/navigation'

export const TaxonomiesCards = () => {
  const { data, error, isLoading } = useSWR<{
    data: { total: number; taxonomies: Record<TaxonomyType, number> }
  }>('/api/taxonomies/count', apiFetcher)

  const router = useRouter()

  if (isLoading) {
    return <>Loading...</>
  }

  if (error) {
    return (
      <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load taxonomy statistics. Please check the logs
      </div>
    )
  }

  const stats: Record<string, number> = data?.data.taxonomies ?? {}
  const total = data?.data.total ?? 0

  return (
    <>
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
