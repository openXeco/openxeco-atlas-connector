import type { db } from '@/config/database.js'

export type ActionProps = {
  data: unknown
  db: typeof db
  id?: string
}
