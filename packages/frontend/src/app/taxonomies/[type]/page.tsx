'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Search, List, Network } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TaxonomyTree } from '@/components/taxonomies/taxonomy-tree'
import { apiClient } from '@/lib/api'
import { TAXONOMY_TYPES, type Taxonomy } from '@/types/taxonomy'

type ViewMode = 'list' | 'tree'

export default function TaxonomyDetailPage({ params }: { params: Promise<{ type: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([])
  const [filteredTaxonomies, setFilteredTaxonomies] = useState<Taxonomy[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [error, setError] = useState<string | null>(null)

  const taxonomyInfo = TAXONOMY_TYPES.find((t) => t.type === resolvedParams.type)
  const hasHierarchy = resolvedParams.type === 'institution' || resolvedParams.type === 'cluster_thematic_area'

  const loadTaxonomies = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get<{ data: Taxonomy[] }>(`/api/taxonomies/${resolvedParams.type}`)
      setTaxonomies(response.data)
      setFilteredTaxonomies(response.data)
    } catch (_err) {
      setError('Failed to load taxonomies')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setError(null)

    try {
      await apiClient.post(`/api/taxonomies/sync/${resolvedParams.type}`, {})
      await loadTaxonomies()
    } catch (_err) {
      setError('Failed to sync taxonomy from ATLAS')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    loadTaxonomies()
  }, [resolvedParams.type])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTaxonomies(taxonomies)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = taxonomies.filter(
        (taxonomy) => taxonomy.name.toLowerCase().includes(query) || taxonomy.description?.toLowerCase().includes(query)
      )
      setFilteredTaxonomies(filtered)
    }
  }, [searchQuery, taxonomies])

  if (!taxonomyInfo) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Taxonomy type not found</h2>
            <Button onClick={() => router.push('/taxonomies')} className="mt-4">
              Back to Taxonomies
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-auto bg-muted/30 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/taxonomies')}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{taxonomyInfo.label}</h2>
                  <p className="text-muted-foreground">{taxonomyInfo.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasHierarchy && (
                  <div className="flex rounded-md border">
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-r-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('tree')}
                      className="rounded-l-none"
                    >
                      <Network className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Button onClick={handleSync} disabled={syncing || loading} className="gap-2">
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync'}
                </Button>
              </div>
            </div>

            {error && <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {filteredTaxonomies.length} {filteredTaxonomies.length === 1 ? 'Term' : 'Terms'}
                    </CardTitle>
                    <CardDescription>{searchQuery ? 'Filtered results' : 'All terms in this taxonomy'}</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search terms..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading taxonomies...</div>
                ) : filteredTaxonomies.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    {searchQuery ? 'No terms match your search' : 'No terms available'}
                  </div>
                ) : viewMode === 'tree' && hasHierarchy ? (
                  <TaxonomyTree taxonomies={filteredTaxonomies} />
                ) : (
                  <div className="space-y-2">
                    {filteredTaxonomies.map((taxonomy) => (
                      <div key={taxonomy.id} className="rounded-md border p-3 hover:bg-accent">
                        <div className="font-medium">{taxonomy.name}</div>
                        {taxonomy.description && (
                          <div className="text-sm text-muted-foreground">{taxonomy.description}</div>
                        )}
                        {taxonomy.parentId && (
                          <div className="mt-1 text-xs text-muted-foreground">Has parent relationship</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
