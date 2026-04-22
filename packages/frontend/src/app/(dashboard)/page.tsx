import { Suspense } from 'react'
import { DashboardCards } from '@/components/dashboard/dahboard-cards'
import { SettingsCheck } from '@/components/dashboard/settings-check'

export default async function DashboardPage() {
  return (
    <>
      <div className='mb-8'>
        <h2 className='text-2xl font-bold tracking-tight'>Dashboard</h2>
        <p className='text-muted-foreground'>Overview of your ATLAS Connector status</p>
      </div>
      <Suspense fallback={<>Loading...</>}>
        <SettingsCheck />
        <DashboardCards />
      </Suspense>
    </>
  )
}
