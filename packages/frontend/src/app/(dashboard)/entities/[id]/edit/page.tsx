import { EditEntity } from '@/components/entities/edit-entity'
import { Link } from '@/components/ui/link'
import { ArrowLeft } from 'lucide-react'
import type { Entity, EntityTaxonomies } from '@/types'

import { getApiClient } from '@/lib/api-client'
import { getTaxonomies } from '@/app/actions/taxonomies'

export default async function EditEntityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const apiClient = await getApiClient()

  let entity: Entity
  let taxonomies: EntityTaxonomies

  try {
    const [entityRes, taxonomiesRes] = await Promise.all([
      apiClient.get<{ data: Entity }>(`/entities/${id}`, { credentials: 'include' }),
      getTaxonomies(),
    ])

    entity = entityRes.data
    taxonomies = taxonomiesRes
  } catch (_e) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Entity not found</h2>
          <Link href={'/entities'} variant="ghost">
            Back to Entities
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {!entity ? (
        <>Loading...</>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-4">
            <Link href={`/entities`} variant={'ghost'}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Edit Entity</h2>
              <p className="text-muted-foreground">Update entity information</p>
            </div>
          </div>

          <EditEntity entity={entity} taxonomies={taxonomies} id={id} />
        </>
      )}
    </>
  )
}
