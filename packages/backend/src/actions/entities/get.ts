import { db } from '@/config/database.js'

export const getEntity = async (id: string) =>
  db.query.entities.findFirst({
    where: { id },
    with: {
      country: true,
      clusterType: true,
      thematicAreas: true,
      sectors: true,
      technologies: true,
      useCases: true,
      fieldsOfActivity: true,
    },
  })
