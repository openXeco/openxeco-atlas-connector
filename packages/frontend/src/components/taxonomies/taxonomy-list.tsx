'use client'

import useSWR from 'swr'
import type { Taxonomy, TaxonomyType } from '@/types'
import { apiFetcher } from '@/lib/swr'
import { useState, useMemo } from 'react'
import { CardHeader, CardTitle, CardDescription, CardContent, Card } from '@/components/ui/card'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { TaxonomyTree } from '@/components/taxonomies/taxonomy-tree-new'

export const TaxonomyList = ({ type }: { type: TaxonomyType }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const { data, error, isLoading } = useSWR<{ data: Taxonomy[] }>(`/api/taxonomies/${type}`, apiFetcher)
  const hasHierarchy = type === 'cluster_thematic_area'

  const filteredTaxonomies = useMemo(() => {
    const taxonomies = data?.data ?? []
    if (searchQuery.trim() === '') return taxonomies
    const query = searchQuery.toLowerCase()
    return taxonomies.filter(
      (taxonomy) => taxonomy.name.toLowerCase().includes(query) || taxonomy.description?.toLowerCase().includes(query)
    )
  }, [searchQuery, data])

  if (isLoading) {
    return null
  }

  return (
    <>
      {error && (
        <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">Failed to load taxonomies</div>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {filteredTaxonomies.length} {filteredTaxonomies.length === 1 ? 'Term' : 'Terms'}
              </CardTitle>
              <CardDescription>{searchQuery ? 'Filtered results' : 'All terms in this taxonomy'}</CardDescription>
            </div>
            {!hasHierarchy ? (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search terms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            ) : undefined}
          </div>
        </CardHeader>
        <CardContent>
          {filteredTaxonomies.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery ? 'No terms match your search' : 'No terms available'}
            </div>
          ) : hasHierarchy ? (
            <TaxonomyTree taxonomies={filteredTaxonomies} />
          ) : (
            <div className="space-y-2">
              {filteredTaxonomies.map((taxonomy) => (
                <div key={taxonomy.id} className="rounded-md border p-3 hover:bg-accent">
                  <div className="font-medium">{taxonomy.name}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
