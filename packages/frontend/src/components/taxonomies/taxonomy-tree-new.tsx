import { Taxonomy } from '@/types'

export const TaxonomyTree = ({ taxonomies }: { taxonomies: Taxonomy[] }) => {
  return (
    <div className={'space-y-1'}>
      {taxonomies
        .filter((t) => !t.parentId)
        .map((t) => (
          <div key={`taxonomy_${t.id}`} className="rounded-md border p-3 hover:bg-accent">
            <div className="font-medium">{t.name}</div>
            <div className="font-light">
              {taxonomies
                .filter((tax) => tax.parentId === t.atlasId)
                .map((child) => (
                  <div key={`taxonomy_${child.id}`} className={'pl-4'}>
                    {child.name}
                  </div>
                ))}
            </div>
          </div>
        ))}
    </div>
  )
}
