import { z } from 'zod'
import { atlasConfig } from '@/db/schema.js'
import { eq } from 'drizzle-orm'
import type { DB } from '@/types.js'

export const generalSettingsSchema = z.object({
  appName: z.string().min(1, 'App name is required').max(100).optional(),
  autoSyncOnPublish: z.boolean().optional(),
  syncConflictResolution: z.enum(['manual', 'local_wins', 'remote_wins']).optional(),
  country: z.string().uuid().optional(),
})

export async function getSetting(key: string, db: DB): Promise<string | null> {
  const [row] = await db.select({ value: atlasConfig.value }).from(atlasConfig).where(eq(atlasConfig.key, key)).limit(1)
  return row?.value ?? null
}

export async function setSetting(key: string, value: string | null, db: DB): Promise<void> {
  await db
    .insert(atlasConfig)
    .values({ key, value })
    .onConflictDoUpdate({
      target: atlasConfig.key,
      set: { value, updatedAt: new Date() },
    })
}
