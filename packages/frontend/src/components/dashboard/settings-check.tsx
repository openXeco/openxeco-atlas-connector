'use client'

import { Link } from '@/components/ui/link'
import useSWR from 'swr'
import type { GeneralSettings } from '@/types'
import { apiFetcher } from '@/lib/swr'
import { Message } from '@/components/ui/message'

export const SettingsCheck = () => {
  const { data, isLoading } = useSWR<{ data: { general: GeneralSettings } }>('/api/settings', apiFetcher)

  const settings = data?.data.general

  if (settings?.country || isLoading) {
    return undefined
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
