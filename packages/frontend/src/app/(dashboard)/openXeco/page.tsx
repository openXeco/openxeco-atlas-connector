'use client'

import { Suspense } from 'react'
import useSWR from 'swr'
import { apiFetcher } from '@/lib/swr'
import { OxeLoginForm } from '@/components/openxeco/login-form'
import { CardHeader, Card, CardContent } from '@/components/ui/card'
import { OxeLogoutButton } from '@/components/openxeco/logout-button'

export default function OpenXecoPage() {
  const { data, error, isLoading } = useSWR<{ success: true }>('/api/openxeco', apiFetcher)

  if (isLoading) {
    return <>Loading opeXeco...</>
  }

  return (
    <>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>openXeco</h2>
          <p className='text-muted-foreground'>Import Entities from openXeco V1</p>
        </div>
      </div>

      <Suspense fallback={<>Loading...</>}>
        <Card className='w-full'>
          <CardHeader>
            <p>Login status: {data?.success ? 'LOGGED' : 'NOT LOGGED'}</p>
            {error && <p>{error}</p>}
          </CardHeader>
          <CardContent>{!data?.success ? <OxeLoginForm /> : <OxeLogoutButton />}</CardContent>
        </Card>
      </Suspense>
    </>
  )
}
