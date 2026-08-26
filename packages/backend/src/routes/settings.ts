import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../config/database.js'
import { requireAdmin } from '../middleware/auth.js'
import { handleRouteError } from '@/utils/reply-helpers.js'
import { appActions } from '@/actions/app/index.js'

export const atlasSettingsSchema = z.object({
  baseUrl: z.string().url('Invalid URL').optional(),
  apiKey: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
})

export async function settingsRoutes(fastify: FastifyInstance): Promise<void> {
  const actions = appActions(db, fastify.log)

  // Get general settings
  fastify.get('/general', { preHandler: requireAdmin }, async (_request, reply) => {
    try {
      const result = await actions.getGeneralSettings()

      return reply.send(result.data)
    } catch (e) {
      handleRouteError(e, reply, fastify.log)
    }
  })

  // Update general settings
  fastify.patch('/general', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      await actions.setGeneralSettings(request.body)

      return reply.send({ message: 'General settings updated successfully' })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  // Get ATLAS API settings
  // @TODO check if we need it
  // fastify.get('/atlas', { preHandler: requireAdmin }, async (_request, reply) => {
  //   const [baseUrl, apiKey, username, password] = await Promise.all([
  //     getSetting(SETTINGS_KEYS.ATLAS_BASE_URL),
  //     getSetting(SETTINGS_KEYS.ATLAS_API_KEY),
  //     getSetting(SETTINGS_KEYS.ATLAS_USERNAME),
  //     getSetting(SETTINGS_KEYS.ATLAS_PASSWORD),
  //   ])
  //
  //   // Fall back to environment variables if not set in database
  //   // Never expose secrets (apiKey, password) — return boolean flags instead
  //   return reply.send({
  //     data: {
  //       baseUrl: baseUrl || process.env.ATLAS_BASE_URL || '',
  //       apiKeyConfigured: !!(apiKey || process.env.ATLAS_API_KEY),
  //       username: username || process.env.ATLAS_USERNAME || '',
  //       passwordConfigured: !!(password || process.env.ATLAS_PASSWORD),
  //     },
  //   })
  // })

  // Update ATLAS API settings
  // @TODO check if we need it
  // fastify.patch('/atlas', { preHandler: requireAdmin }, async (request, reply) => {
  //   try {
  //     const body = atlasSettingsSchema.parse(request.body)
  //
  //     const updates: Promise<void>[] = []
  //
  //     if (body.baseUrl !== undefined) {
  //       updates.push(setSetting(SETTINGS_KEYS.ATLAS_BASE_URL, body.baseUrl))
  //     }
  //     if (body.apiKey !== undefined) {
  //       updates.push(setSetting(SETTINGS_KEYS.ATLAS_API_KEY, body.apiKey))
  //     }
  //     if (body.username !== undefined) {
  //       updates.push(setSetting(SETTINGS_KEYS.ATLAS_USERNAME, body.username))
  //     }
  //     if (body.password !== undefined) {
  //       updates.push(setSetting(SETTINGS_KEYS.ATLAS_PASSWORD, body.password))
  //     }
  //
  //     await Promise.all(updates)
  //
  //     return reply.send({ message: 'ATLAS settings updated successfully' })
  //   } catch (error) {
  //     return handleRouteError(error, reply, fastify)
  //   }
  // })

  // Test ATLAS API connection
  // @TODO check if we need it
  // fastify.post('/atlas/test', { preHandler: requireAdmin }, async (request, reply) => {
  //   try {
  //     const body = atlasSettingsSchema.parse(request.body)
  //
  //     // Use provided values or fall back to stored/env values
  //     const baseUrl = body.baseUrl || (await getSetting(SETTINGS_KEYS.ATLAS_BASE_URL)) || process.env.ATLAS_BASE_URL
  //     const username = body.username || (await getSetting(SETTINGS_KEYS.ATLAS_USERNAME)) || process.env.ATLAS_USERNAME
  //     const password = body.password || (await getSetting(SETTINGS_KEYS.ATLAS_PASSWORD)) || process.env.ATLAS_PASSWORD
  //
  //     if (!baseUrl) {
  //       return sendErrorReply({ reply, type: 'badRequest', message: 'ATLAS base URL is required' })
  //     }
  //
  //     // SSRF protection: only allow HTTPS URLs with non-private hostnames
  //     try {
  //       const parsed = new URL(baseUrl)
  //       if (parsed.protocol !== 'https:') {
  //         return sendErrorReply({ reply, type: 'badRequest', message: 'ATLAS base URL must use HTTPS' })
  //       }
  //       const hostname = parsed.hostname.toLowerCase()
  //       const blocked =
  //         hostname === 'localhost' ||
  //         hostname === '127.0.0.1' ||
  //         hostname === '::1' ||
  //         hostname.startsWith('10.') ||
  //         hostname.startsWith('192.168.') ||
  //         hostname.startsWith('169.254.') ||
  //         /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
  //       if (blocked) {
  //         return sendErrorReply({
  //           reply,
  //           type: 'badRequest',
  //           message: 'ATLAS base URL must not point to a private or loopback address',
  //         })
  //       }
  //     } catch {
  //       return sendErrorReply({ reply, type: 'badRequest', message: 'ATLAS base URL is not a valid URL' })
  //     }
  //
  //     // Test the connection by making a simple request
  //     const testUrl = `${baseUrl}/taxonomy_term/country`
  //
  //     const headers: Record<string, string> = {
  //       Accept: 'application/vnd.api+json',
  //     }
  //
  //     // Add basic auth if credentials are provided
  //     if (username && password) {
  //       const auth = Buffer.from(`${username}:${password}`).toString('base64')
  //       headers.Authorization = `Basic ${auth}`
  //     }
  //
  //     const response = await fetch(testUrl, {
  //       method: 'GET',
  //       headers,
  //       signal: AbortSignal.timeout(10000),
  //     })
  //
  //     if (response.ok) {
  //       return reply.send({
  //         success: true,
  //         message: 'Connection successful',
  //       })
  //     }
  //     return reply.status(response.status).send({
  //       success: false,
  //       message: `Connection failed: ${response.status} ${response.statusText}`,
  //     })
  //   } catch (error) {
  //     return handleRouteError(error, reply, fastify)
  //   }
  // })
}
