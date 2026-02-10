import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from '../config/database.js'
import { logger } from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function runMigrations(): Promise<void> {
  // In production (compiled): this file is at dist/db/migrate.js
  //   -> resolve to ../../src/db/migrations
  // In development (tsx): this file is at src/db/migrate.ts
  //   -> resolve to ./migrations
  const isCompiled = __dirname.includes('/dist/')
  const migrationsFolder = isCompiled
    ? path.resolve(__dirname, '../../src/db/migrations')
    : path.resolve(__dirname, './migrations')

  logger.info('Running database migrations...', { migrationsFolder })

  try {
    await migrate(db, { migrationsFolder })
    logger.info('Database migrations completed successfully')
  } catch (error) {
    logger.error('Database migration failed', error as Error)
    throw error
  }
}
