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
        <FullCard
          title={'Total Types'}
          Icon={Database}
          value={TAXONOMY_TYPES.length}
          description={'Taxonomy categories'}
        />

        <FullCard title={'Total Terms'} Icon={Database} value={isLoading ? '...' : total.toLocaleString()} />
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {TAXONOMY_TYPES.map((taxonomyType) => (
          <FullCard
            variant={'clickable'}
            key={taxonomyType.type}
            title={taxonomyType.label}
            Icon={ChevronRight}
            className={'cursor-pointer transition-colors hover:bg-accent'}
            onClick={() => router.push(`/taxonomies/${taxonomyType.type}`)}
            value={isLoading ? '...' : stats[taxonomyType.type] || 0}
          />
        ))}
      </div>
    </>
  )
}
