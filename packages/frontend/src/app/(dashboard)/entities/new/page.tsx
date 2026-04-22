'use client'

import { ArrowLeft } from 'lucide-react'
import { CreateEntity } from '@/components/entities/create-entity'
import { Link } from '@/components/ui/link'
import { apiFetcher, swrDefaultOptions } from '@/lib/swr'
import useSWR from 'swr'
import type { EntityTaxonomies, GeneralSettings } from '@/types'

export default function CreateEntityPage() {
  const { data: taxonomiesData, isLoading: taxonomiesLoading } = useSWR<{ data: EntityTaxonomies }>(
    '/api/taxonomies',
    apiFetcher,
    swrDefaultOptions,
  )
  const { data: settingsData, isLoading: settingsLoading } = useSWR<{ data: { general: GeneralSettings } }>(
    '/api/settings',
    apiFetcher,
    swrDefaultOptions,
  )

  if (taxonomiesLoading || settingsLoading) {
    return <>Loading...</>
  }

  if (!taxonomiesData || !settingsData) {
    return <>Error loading taxonomies. Please refresh</>
  }

  const taxonomies = taxonomiesData?.data
  const defaultCountry = settingsData.data.general.country

  return (
    <>
      <div className='mb-6 flex items-center gap-4'>
        <Link href={'/entities'} variant={'ghost'}>
          <ArrowLeft className='h-5 w-5' />
        </Link>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Create New Entity</h2>
          <p className='text-muted-foreground'>Add a new cluster entity to the system</p>
        </div>
      </div>

      <CreateEntity taxonomies={taxonomies} defaultCountry={defaultCountry} />
    </>
  )
}
