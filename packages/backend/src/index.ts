import { buildApp } from './app.js'
import { config } from './config/index.js'
import { closeDatabase } from './config/database.js'
import { runMigrations } from './db/migrate.js'
import { logger } from './utils/logger.js'

async function main(): Promise<void> {
  await runMigrations()

  const app = await buildApp()

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`)
    await app.close()
    await closeDatabase()
    process.exit(0)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  try {
    await app.listen({ port: config.PORT, host: config.HOST })
    logger.info(`Server running at http://${config.HOST}:${config.PORT}`)
  } catch (err) {
    logger.error('Failed to start server', { error: err })
    process.exit(1)
  }
}

main()
