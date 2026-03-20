import type { TaxonomyType } from '@/types'
import { TAXONOMY_TYPES } from '@/data/taxonomies'
import { ArrowLeft } from 'lucide-react'
import { SyncTypeButton } from '@/components/taxonomies/sync-type-button'
import { TaxonomyList } from '@/components/taxonomies/taxonomy-list'
import { Suspense } from 'react'
import { Link } from '@/components/ui/link'

export default async function TaxonomyDetailsPage({ params }: { params: Promise<{ type: TaxonomyType }> }) {
  const { type } = await params

  const taxonomyInfo = TAXONOMY_TYPES.find((t) => t.type === type)

  return (
    <>
      <div className='mb-6 flex items-start justify-between'>
        <div className='flex items-center gap-4'>
          <Link href={'/taxonomies'} variant={'ghost'}>
            <ArrowLeft className='h-5 w-5' />
          </Link>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              {taxonomyInfo ? taxonomyInfo.label : 'Taxonomy type not found.'}
            </h2>
            {taxonomyInfo && <p className='text-muted-foreground'>{taxonomyInfo.description}</p>}
          </div>
        </div>
        {taxonomyInfo && <SyncTypeButton type={type} />}
      </div>

      <Suspense fallback={<>Loading...</>}>
        <TaxonomyList type={type} />
      </Suspense>
    </>
  )
}
