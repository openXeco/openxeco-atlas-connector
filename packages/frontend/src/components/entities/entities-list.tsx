'use client'

import { CardHeader, CardTitle, CardDescription, CardContent, Card } from '@/components/ui/card'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EntityDataTable } from '@/components/entities/entity-data-table'
import useSWR from 'swr'
import type { Entity, EntityListParams } from '@/types'
import { apiFetcher, swrDefaultOptions } from '@/lib/swr'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteEntity } from '@/app/actions/entities'

export const EntitiesList = () => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, _setFilters] = useState<EntityListParams>({
    page: 1,
    limit: 10,
  })

  const params = new URLSearchParams()
  if (filters.page) {
    params.append('page', filters.page.toString())
  }

  if (filters.limit) {
    params.append('limit', filters.limit.toString())
  }

  if (filters.status) {
    params.append('status', filters.status)
  }

  if (filters.syncStatus) {
    params.append('syncStatus', filters.syncStatus)
  }

  const { data, error, isLoading, mutate } = useSWR<{ data: Entity[] }>(
    `/api/entities?${params.toString()}`,
    apiFetcher,
    swrDefaultOptions,
  )

  const entities = data?.data ?? []

  const handleViewEntity = (id: string) => {
    router.push(`/entities/${id}`)
  }

  const handleEditEntity = (id: string) => {
    router.push(`/entities/${id}/edit`)
  }

  const handleDeleteEntity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entity?')) {
      return
    }

    try {
      await deleteEntity(id)
      await mutate()
    } catch (_err) {
      // error handled by SWR
    }
  }

  const filteredEntities = entities.filter((entity) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return entity.name.toLowerCase().includes(query) || entity.description?.toLowerCase().includes(query)
  })

  return (
    <>
      {error && (
        <div className='mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive'>Failed to load entities</div>
      )}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>All Entities</CardTitle>
              <CardDescription>{filteredEntities.length} entities found</CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  placeholder='Search entities...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-64 pl-9'
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EntityDataTable
            data={filteredEntities}
            loading={isLoading}
            onView={handleViewEntity}
            onEdit={handleEditEntity}
            onDelete={handleDeleteEntity}
          />
        </CardContent>
      </Card>
    </>
  )
}
