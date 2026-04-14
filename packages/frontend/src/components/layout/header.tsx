'use client'

import { User, LogOut } from 'lucide-react'
import useSWR from 'swr'
import { apiFetcher, swrDefaultOptions } from '@/lib/swr'
import { redirect } from 'next/navigation'
import type { User as TUser } from '@/types'
import { logout } from '@/app/actions/auth'
import { useActionState, useEffect } from 'react'

export function Header() {
  const { data, error, isLoading } = useSWR<{ data: TUser }>('/api/auth/me', apiFetcher, {
    ...swrDefaultOptions,
  })
  const [state, formAction] = useActionState(logout, undefined)

  useEffect(() => {
    if (state?.success === true) {
      redirect('/login')
    }
  }, [state])

  if (isLoading) {
    return <>loading...</>
  }

  if (error || !data) {
    redirect('/login')
  }

  const user = data.data

  return (
    <header className='flex h-16 items-center justify-between border-b bg-card px-6'>
      <div>
        <h1 className='text-lg font-semibold'>Dashboard</h1>
      </div>
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground'>
          <User className='h-5 w-5' />
          <span>{user?.email || 'Admin'}</span>
        </div>
        <form action={formAction}>
          <button
            type='submit'
            className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          >
            <LogOut className='h-5 w-5' />
            <span>Logout</span>
          </button>
        </form>
      </div>
    </header>
  )
}
