import { defineRelations } from 'drizzle-orm'
import * as schema from '@/db/schema.js'

export const relations = defineRelations(schema, (r) => ({
  entities: {
    country: r.one.taxonomies({
      from: r.entities.countryId,
      to: r.taxonomies.id,
      where: {
        taxonomyType: 'country',
      },
    }),
    clusterType: r.one.taxonomies({
      from: r.entities.clusterTypeId,
      to: r.taxonomies.id,
      where: {
        taxonomyType: 'cluster_type',
      },
    }),
    thematicAreas: r.many.taxonomies({
      from: r.entities.id.through(r.entityThematicAreas.entityId),
      to: r.taxonomies.id.through(r.entityThematicAreas.taxonomyId),
    }),
    sectors: r.many.taxonomies({
      from: r.entities.id.through(r.entitySectors.entityId),
      to: r.taxonomies.id.through(r.entitySectors.taxonomyId),
    }),
    technologies: r.many.taxonomies({
      from: r.entities.id.through(r.entityTechnologies.entityId),
      to: r.taxonomies.id.through(r.entityTechnologies.taxonomyId),
    }),
    useCases: r.many.taxonomies({
      from: r.entities.id.through(r.entityUseCases.entityId),
      to: r.taxonomies.id.through(r.entityUseCases.taxonomyId),
    }),
    fieldsOfActivity: r.many.taxonomies({
      from: r.entities.id.through(r.entityFieldsOfActivity.entityId),
      to: r.taxonomies.id.through(r.entityFieldsOfActivity.taxonomyId),
    }),
  },
}))
