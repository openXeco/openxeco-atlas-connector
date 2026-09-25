'use client'

import { Link } from '@/components/ui/link'
import useSWR from 'swr'
import type { GeneralSettings, Taxonomy } from '@/types'
import { apiFetcher, swrDefaultOptions } from '@/lib/swr'
import { Message } from '@/components/ui/message'

export const SettingsCheck = () => {
  const { data, isLoading } = useSWR<{ data: { general: GeneralSettings } }>('/api/settings', apiFetcher)
  const { data: countriesData, isLoading: countriesLoading } = useSWR<{ data: Taxonomy[] }>(
    '/api/taxonomies/country',
    apiFetcher,
    swrDefaultOptions,
  )

  const settings = data?.data.general
  const countries = countriesData?.data || []

  if (isLoading || countriesLoading) {
    return undefined
  }

  if (settings?.country) {
    return (
      <div className={'my-4 rounded-md bg-accent p-4'}>
        <div className={'text-sm font-bold'}>
          NCC {(countries.find((c) => c.id === settings?.country) as Taxonomy)?.name}
        </div>
      </div>
    )
  }

  return (
    <div className={'my-4'}>
      <Message success={false} duration={99}>
        Warning: before creating entities, please set a country in the{' '}
        <Link variant={'link'} href={'/settings'}>
          Settings {'>'} General
        </Link>
        panel
      </Message>
    </div>
  )
}
