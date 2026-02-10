import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../config/database.js'
import { atlasConfig } from '../db/schema.js'
import { authenticate } from '../middleware/auth.js'

// Settings keys
const SETTINGS_KEYS = {
  ATLAS_BASE_URL: 'atlas_base_url',
  ATLAS_API_KEY: 'atlas_api_key',
  ATLAS_USERNAME: 'atlas_username',
  ATLAS_PASSWORD: 'atlas_password',
  APP_NAME: 'app_name',
  AUTO_SYNC_ON_PUBLISH: 'auto_sync_on_publish',
  SYNC_CONFLICT_RESOLUTION: 'sync_conflict_resolution',
} as const

const atlasSettingsSchema = z.object({
  baseUrl: z.string().url('Invalid URL').optional(),
  apiKey: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
})

const generalSettingsSchema = z.object({
  appName: z.string().min(1, 'App name is required').max(100).optional(),
  autoSyncOnPublish: z.boolean().optional(),
  syncConflictResolution: z.enum(['manual', 'local_wins', 'remote_wins']).optional(),
})

async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select({ value: atlasConfig.value }).from(atlasConfig).where(eq(atlasConfig.key, key)).limit(1)
  return row?.value ?? null
}

async function setSetting(key: string, value: string | null): Promise<void> {
  const [existing] = await db.select({ id: atlasConfig.id }).from(atlasConfig).where(eq(atlasConfig.key, key)).limit(1)

  if (existing) {
    await db.update(atlasConfig).set({ value, updatedAt: new Date() }).where(eq(atlasConfig.key, key))
  } else {
    await db.insert(atlasConfig).values({ key, value })
  }
}

export async function settingsRoutes(fastify: FastifyInstance): Promise<void> {
  // Get ATLAS API settings
  fastify.get('/atlas', { preHandler: authenticate }, async (_request, reply) => {
    const [baseUrl, apiKey, username, password] = await Promise.all([
      getSetting(SETTINGS_KEYS.ATLAS_BASE_URL),
      getSetting(SETTINGS_KEYS.ATLAS_API_KEY),
      getSetting(SETTINGS_KEYS.ATLAS_USERNAME),
      getSetting(SETTINGS_KEYS.ATLAS_PASSWORD),
    ])

    // Fall back to environment variables if not set in database
    return reply.send({
      data: {
        baseUrl: baseUrl || process.env.ATLAS_BASE_URL || '',
        apiKey: apiKey || process.env.ATLAS_API_KEY || '',
        username: username || process.env.ATLAS_USERNAME || '',
        password: password || process.env.ATLAS_PASSWORD || '',
      },
    })
  })

  // Update ATLAS API settings
  fastify.patch('/atlas', { preHandler: authenticate }, async (request, reply) => {
    try {
      const body = atlasSettingsSchema.parse(request.body)

      const updates: Promise<void>[] = []

      if (body.baseUrl !== undefined) {
        updates.push(setSetting(SETTINGS_KEYS.ATLAS_BASE_URL, body.baseUrl))
      }
      if (body.apiKey !== undefined) {
        updates.push(setSetting(SETTINGS_KEYS.ATLAS_API_KEY, body.apiKey))
      }
      if (body.username !== undefined) {
        updates.push(setSetting(SETTINGS_KEYS.ATLAS_USERNAME, body.username))
      }
      if (body.password !== undefined) {
        updates.push(setSetting(SETTINGS_KEYS.ATLAS_PASSWORD, body.password))
      }

      await Promise.all(updates)

      return reply.send({ message: 'ATLAS settings updated successfully' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0]?.message || 'Invalid input',
          details: error.errors,
        })
      }
      throw error
    }
  })

  // Test ATLAS API connection
  fastify.post('/atlas/test', { preHandler: authenticate }, async (request, reply) => {
    try {
      const body = atlasSettingsSchema.parse(request.body)

      // Use provided values or fall back to stored/env values
      const baseUrl = body.baseUrl || (await getSetting(SETTINGS_KEYS.ATLAS_BASE_URL)) || process.env.ATLAS_BASE_URL
      const username = body.username || (await getSetting(SETTINGS_KEYS.ATLAS_USERNAME)) || process.env.ATLAS_USERNAME
      const password = body.password || (await getSetting(SETTINGS_KEYS.ATLAS_PASSWORD)) || process.env.ATLAS_PASSWORD

      if (!baseUrl) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'ATLAS base URL is required',
        })
      }

      // Test the connection by making a simple request
      const testUrl = `${baseUrl}/taxonomy_term/country`

      const headers: Record<string, string> = {
        Accept: 'application/vnd.api+json',
      }

      // Add basic auth if credentials are provided
      if (username && password) {
        const auth = Buffer.from(`${username}:${password}`).toString('base64')
        headers['Authorization'] = `Basic ${auth}`
      }

      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000),
      })

      if (response.ok) {
        return reply.send({
          success: true,
          message: 'Connection successful',
        })
      } else {
        return reply.status(response.status).send({
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection test failed'
      return reply.status(500).send({
        success: false,
        message: `Connection failed: ${message}`,
      })
    }
  })

  // Get general settings
  fastify.get('/general', { preHandler: authenticate }, async (_request, reply) => {
    const [appName, autoSyncOnPublish, syncConflictResolution] = await Promise.all([
      getSetting(SETTINGS_KEYS.APP_NAME),
      getSetting(SETTINGS_KEYS.AUTO_SYNC_ON_PUBLISH),
      getSetting(SETTINGS_KEYS.SYNC_CONFLICT_RESOLUTION),
    ])

    return reply.send({
      data: {
        appName: appName || 'ATLAS Connector',
        autoSyncOnPublish: autoSyncOnPublish === 'true',
        syncConflictResolution: syncConflictResolution || 'manual',
      },
    })
  })

  // Update general settings
  fastify.patch('/general', { preHandler: authenticate }, async (request, reply) => {
    try {
      const body = generalSettingsSchema.parse(request.body)

      const updates: Promise<void>[] = []

      if (body.appName !== undefined) {
        updates.push(setSetting(SETTINGS_KEYS.APP_NAME, body.appName))
      }
      if (body.autoSyncOnPublish !== undefined) {
        updates.push(setSetting(SETTINGS_KEYS.AUTO_SYNC_ON_PUBLISH, String(body.autoSyncOnPublish)))
      }
      if (body.syncConflictResolution !== undefined) {
        updates.push(setSetting(SETTINGS_KEYS.SYNC_CONFLICT_RESOLUTION, body.syncConflictResolution))
      }

      await Promise.all(updates)

      return reply.send({ message: 'General settings updated successfully' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0]?.message || 'Invalid input',
          details: error.errors,
        })
      }
      throw error
    }
  })
}
