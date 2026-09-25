import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import type { Env } from '@/types.js'
import { envSchema } from '@/config/schema.js'

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
