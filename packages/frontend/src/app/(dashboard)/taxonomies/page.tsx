import { Suspense } from 'react'
import { TaxonomiesCards } from '@/components/taxonomies/taxonomies-cards'
import { SyncAllButton } from '@/components/taxonomies/sync-all-button'

export default async function TaxonomiesPage() {
  return (
    <>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Taxonomies</h2>
          <p className="text-muted-foreground">Manage taxonomy terms from ATLAS API</p>
        </div>

        <SyncAllButton />
      </div>

      <Suspense fallback={<>Loading...</>}>
        <TaxonomiesCards />
      </Suspense>
    </>
  )
}
