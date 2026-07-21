'use client'

import type { TaxonomyType } from '@/types'
import useSWR from 'swr'
import { apiFetcher, swrDefaultOptions } from '@/lib/swr'
import { Database, ChevronRight } from 'lucide-react'
import { TAXONOMY_TYPES } from '@/data/taxonomies'
import { useRouter } from 'next/navigation'
import { FullCard } from '@/components/ui/full-card'

export const TaxonomiesCards = () => {
  const { data, error, isLoading } = useSWR<{
    data: { total: number; taxonomies: Record<TaxonomyType, number> }
  }>('/api/taxonomies/count', apiFetcher, swrDefaultOptions)

  const router = useRouter()

  if (isLoading) {
    return <>Loading...</>
  }

  if (error) {
    return (
      <div className='mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive'>
        Failed to load taxonomy statistics. Please check the logs
      </div>
    )
  }

  const stats: Record<string, number> = data?.data.taxonomies ?? {}
  const total = data?.data.total ?? 0

  return (
    <>
      <div className='mb-6 grid gap-4 md:grid-cols-3'>
        <FullCard title={'Total Types'} Icon={Database}>
          <div className='text-2xl font-bold'>{TAXONOMY_TYPES.length}</div>
          <p className='text-xs text-muted-foreground'>Taxonomy categories</p>
        </FullCard>

        <FullCard title={'Total Terms'} Icon={Database}>
          <div className='text-2xl font-bold'>{isLoading ? '...' : total.toLocaleString()}</div>
          <p className='text-xs text-muted-foreground'>Across all types</p>
        </FullCard>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {TAXONOMY_TYPES.map((taxonomyType) => (
          <FullCard
            key={taxonomyType.type}
            title={taxonomyType.label}
            Icon={ChevronRight}
            className={'cursor-pointer transition-colors hover:bg-accent'}
            onClick={() => router.push(`/taxonomies/${taxonomyType.type}`)}
          >
            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>Terms:</span>
              <span className='text-lg font-semibold'>
                {isLoading ? '...' : (stats[taxonomyType.type] || 0).toLocaleString()}
              </span>
            </div>
          </FullCard>
        ))}
      </div>
    </>
  )
}
