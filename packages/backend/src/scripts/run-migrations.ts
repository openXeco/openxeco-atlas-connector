import { runMigrations } from '../db/migrate.js'
import { closeDatabase } from '../config/database.js'
import { getLogger } from '@/utils/logger.js'

const logger = getLogger()

runMigrations()
  .then(() => {
    logger.info('Migration run complete')
    return closeDatabase()
  })
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error(`Migration run failed: ${JSON.stringify(error, null, 2)}`)
    process.exit(1)
  })
