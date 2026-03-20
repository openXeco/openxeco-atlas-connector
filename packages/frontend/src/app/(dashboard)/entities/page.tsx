import { Plus } from 'lucide-react'
import { Suspense } from 'react'
import { EntitiesList } from '@/components/entities/entities-list'
import { Link } from '@/components/ui/link'

export default async function EntitiesPage() {
  return (
    <>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Entities</h2>
          <p className='text-muted-foreground'>Manage cluster entities and sync with ATLAS</p>
        </div>
        <Link href={'/entities/new'} variant='default'>
          <Plus className='h-4 w-4' />
          Create Entity
        </Link>
      </div>

      <Suspense fallback={<>Loading...</>}>
        <EntitiesList />
      </Suspense>
    </>
  )
}
