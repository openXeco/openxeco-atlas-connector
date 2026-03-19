import { db } from '../config/database.js'
import { users } from '../db/schema.js'
import { hashPassword } from '../services/password.js'
import { eq } from 'drizzle-orm'
import { getLogger } from '@/utils/logger.js'

const logger = getLogger()

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@atlas-connector.local'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123456'

async function seedAdmin() {
  try {
    logger.info('Starting admin user seed...')

    const [existingUser] = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1)

    if (existingUser) {
      logger.info(`Admin user already exists: ${ADMIN_EMAIL}`)
      return
    }

    const passwordHash = await hashPassword(ADMIN_PASSWORD)

    await db.insert(users).values({
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'admin',
    })

    logger.info(`✓ Admin user created successfully: ${ADMIN_EMAIL}`)
    logger.info(`  Password: ${ADMIN_PASSWORD}`)
    logger.warn('  ⚠️  Please change the password after first login!')
  } catch (error) {
    logger.error(error as Error, 'Failed to seed admin user:')
    throw error
  }
}

seedAdmin()
  .then(() => {
    logger.info('Seed completed')
    process.exit(0)
  })
  .catch((error) => {
    logger.error(error as Error, 'Seed failed:')
    process.exit(1)
  })
