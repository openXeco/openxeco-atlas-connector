import { ArrowLeft } from 'lucide-react'
import { getTaxonomies } from '@/data/taxonomies'
import { CreateEntity } from '@/components/entities/create-entity'
import { Link } from '@/components/ui/link'

export default async function CreateEntityPage() {
  const taxonomies = await getTaxonomies()

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/entities`}
          variant={'ghost'}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create New Entity</h2>
          <p className="text-muted-foreground">Add a new cluster entity to the system</p>
        </div>
      </div>

      <CreateEntity taxonomies={taxonomies} />
    </>
  )
}
