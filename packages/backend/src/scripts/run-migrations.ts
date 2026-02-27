import { runMigrations } from '../db/migrate.js'
import { closeDatabase } from '../config/database.js'
import { logger } from '../utils/logger.js'

runMigrations()
  .then(() => {
    logger.info('Migration run complete')
    return closeDatabase()
  })
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('Migration run failed:', error as Error)
    process.exit(1)
  })
