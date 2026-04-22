'use client'

import { EditEntity } from '@/components/entities/edit-entity'
import { Link } from '@/components/ui/link'
import { ArrowLeft } from 'lucide-react'
import type { Entity, EntityTaxonomies, EntityVersion } from '@/types'

import React from 'react'
import useSWR from 'swr'
import { apiFetcher, swrDefaultOptions } from '@/lib/swr'

export default function EditEntityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)

  const { data, isLoading } = useSWR<{ data: { entity: Entity; versions: EntityVersion[] } }>(
    `/api/entities/${id}`,
    apiFetcher,
    swrDefaultOptions,
  )
  const { data: taxonomiesData, isLoading: taxonomiesLoading } = useSWR<{ data: EntityTaxonomies }>(
    '/api/taxonomies',
    apiFetcher,
    swrDefaultOptions,
  )

  if (isLoading || taxonomiesLoading) {
    return <>Loading...</>
  }

  if (!taxonomiesData) {
    return <>No taxonomies found.</>
  }

  if (!data) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold'>Entity not found</h2>
          <Link href={'/entities'} variant='ghost'>
            Back to Entities
          </Link>
        </div>
      </div>
    )
  }

  const entity = data.data.entity
  const taxonomies = taxonomiesData.data

  return (
    <>
      {!entity ? (
        <>Loading...</>
      ) : (
        <>
          <div className='mb-6 flex items-center gap-4'>
            <Link href={'/entities'} variant={'ghost'}>
              <ArrowLeft className='h-5 w-5' />
            </Link>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>Edit Entity</h2>
              <p className='text-muted-foreground'>Update entity information</p>
            </div>
          </div>

          <EditEntity entity={entity} taxonomies={taxonomies} id={id} />
        </>
      )}
    </>
  )
}
