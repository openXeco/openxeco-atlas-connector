import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { z } from 'zod'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../../../.env'),
]

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath })
    break
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string().url(),

  REDIS_URL: z.string().url().optional(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('5m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  ATLAS_BASE_URL: z.string().url(),
  ATLAS_API_KEY: z.string(),
  ATLAS_USERNAME: z.string().optional(),
  ATLAS_PASSWORD: z.string().optional(),

  FRONTEND_URL: z.string().url().optional(),

  HTTPS_PROXY: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

function loadConfig(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    // biome-ignore lint/suspicious/noConsole: Here is fine
    console.error('❌ Invalid environment variables:')
    // biome-ignore lint/suspicious/noConsole: Here is fine
    console.error(result.error.format())
    process.exit(1)
  }

  return result.data
}

export const config = loadConfig()
