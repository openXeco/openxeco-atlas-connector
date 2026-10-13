import { Suspense } from 'react'

export default async function OpenXecoPage() {
  return (
    <>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>openXeco</h2>
          <p className='text-muted-foreground'>Import Entities from openXeco V1</p>
        </div>
      </div>

      <Suspense fallback={<>Loading...</>}>Details</Suspense>
    </>
  )
}
