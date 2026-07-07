import type { db } from '@/config/database.js'
import type { z } from 'zod'
import type { createOrUpdateEntitySchema } from '@/actions/entities.js'

export type ActionProps = {
  data: unknown
  db: typeof db
  id?: string
}

export type CreateOrUpdateEntity = z.infer<typeof createOrUpdateEntitySchema>

