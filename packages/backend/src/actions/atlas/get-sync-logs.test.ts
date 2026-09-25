import { describe, expect, it, vi } from 'vitest'
import type { SQL } from 'drizzle-orm'
import { PgDialect } from 'drizzle-orm/pg-core'
import { getSyncLogs, syncLogsQuerySchema } from '@/actions/atlas/get-sync-logs.js'
import { makeLogger } from '@/actions/atlas/test-support/fakes.js'
import { syncLogs, type SyncLog } from '@/db/schema.js'
import type { DB } from '@/types.js'

const makeDatabase = (logs: SyncLog[] = [], total = logs.length) => {
  const offset = vi.fn().mockResolvedValue(logs)
  const limit = vi.fn().mockReturnValue({ offset })
  const orderBy = vi.fn().mockReturnValue({ limit })
  const where = vi.fn().mockReturnValue({ orderBy })
  const from = vi.fn().mockReturnValue({ where })
  const countWhere = vi.fn().mockResolvedValue([{ total }])
  const countFrom = vi.fn().mockReturnValue({ where: countWhere })
  const select = vi.fn().mockReturnValueOnce({ from }).mockReturnValueOnce({ from: countFrom })

  return { db: { select } as unknown as DB, from, countFrom, where, countWhere, orderBy, limit, offset }
}

const dialect = new PgDialect()
const toQuery = (sql: SQL) => dialect.sqlToQuery(sql)

describe('getSyncLogs', () => {
  it('returns full log details with page counts and a separate total', async () => {
    const logs: SyncLog[] = [
      {
        id: 'log-1',
        entityId: 'entity-1',
        entityType: 'entity',
        operation: 'create',
        status: 'failed',
        createdAt: new Date('2026-09-18T10:00:00Z'),
        details: {
          errorMessage: 'Invalid entity',
          errorDetails: [{ status: '422', detail: 'Invalid email', source: { pointer: '/data/attributes/email' } }],
        },
      },
    ]
    const fake = makeDatabase(logs, 25)

    await expect(
      getSyncLogs({ data: { page: 3, limit: 10 }, db: fake.db, logger: makeLogger().logger }),
    ).resolves.toEqual({ success: true, data: { data: logs, meta: { page: 3, limit: 10, count: 1, total: 25 } } })

    expect(fake.from).toHaveBeenCalledWith(syncLogs)
    expect(fake.countFrom).toHaveBeenCalledWith(syncLogs)
    expect(fake.limit).toHaveBeenCalledWith(10)
    expect(fake.offset).toHaveBeenCalledWith(20)
    expect(fake.where).toHaveBeenCalledWith(undefined)
    expect(fake.countWhere).toHaveBeenCalledWith(undefined)
    expect(fake.orderBy.mock.calls[0].map((sql: SQL) => toQuery(sql).sql)).toEqual([
      '"sync_logs"."created_at" desc',
      '"sync_logs"."id" desc',
    ])
  })

  it('applies all filters to both the page and the total with inclusive date bounds', async () => {
    const fake = makeDatabase()
    const data = syncLogsQuerySchema.parse({
      entityId: '123e4567-e89b-12d3-a456-426614174000',
      operation: 'force-pull',
      status: 'failed',
      startDate: '2026-09-01T00:00:00Z',
      endDate: '2026-09-18T12:00:00+02:00',
    })

    await getSyncLogs({ data, db: fake.db, logger: makeLogger().logger })

    const expected = {
      sql: '(("sync_logs"."entity_id" = $1) and ("sync_logs"."operation" = $2) and ("sync_logs"."status" = $3) and ("sync_logs"."created_at" >= $4) and ("sync_logs"."created_at" <= $5))',
      params: [data.entityId, 'force-pull', 'failed', '2026-09-01T00:00:00.000Z', '2026-09-18T10:00:00.000Z'],
    }
    expect(toQuery(fake.where.mock.calls[0][0])).toMatchObject(expected)
    expect(toQuery(fake.countWhere.mock.calls[0][0])).toMatchObject(expected)
  })

  it.each([0, 12])('returns an empty page while preserving total=%s', async (total) => {
    const fake = makeDatabase([], total)
    await expect(
      getSyncLogs({ data: { page: 4, limit: 20 }, db: fake.db, logger: makeLogger().logger }),
    ).resolves.toEqual({ success: true, data: { data: [], meta: { page: 4, limit: 20, count: 0, total } } })
  })

  it.each(['page', 'count'])('returns an action error when the %s query fails', async (query) => {
    const fake = makeDatabase()
    const logger = makeLogger()
    const error = new Error('Database unavailable')
    if (query === 'page') {
      fake.offset.mockRejectedValueOnce(error)
    } else {
      fake.countWhere.mockRejectedValueOnce(error)
    }

    await expect(getSyncLogs({ data: { page: 1, limit: 20 }, db: fake.db, logger: logger.logger })).resolves.toEqual({
      success: false,
      code: 'unexpected',
      message: 'Unable to retrieve synchronization logs.',
    })
    expect(logger.error).toHaveBeenCalledWith({ error }, 'Unable to retrieve synchronization logs.')
  })
})

describe('syncLogsQuerySchema', () => {
  it('defaults pagination and coerces query strings', () => {
    expect(syncLogsQuerySchema.parse({})).toEqual({ page: 1, limit: 20 })
    expect(syncLogsQuerySchema.parse({ page: '2', limit: '100' })).toEqual({ page: 2, limit: 100 })
  })

  it.each(['create', 'update', 'force-create', 'force-push', 'force-pull', 'sync'])(
    'accepts operation %s',
    (operation) => {
      expect(syncLogsQuerySchema.parse({ operation }).operation).toBe(operation)
    },
  )

  it.each(['synced', 'failed'])('accepts status %s', (status) => {
    expect(syncLogsQuerySchema.parse({ status }).status).toBe(status)
  })

  it.each([
    { page: '0' },
    { page: '1.5' },
    { limit: '0' },
    { limit: '101' },
    { limit: 'no' },
    { entityId: 'invalid' },
    { operation: 'push' },
    { status: 'success' },
    { startDate: 'invalid' },
    { endDate: '2026-09-18' },
    { startDate: '2026-09-18T10:00:00Z', endDate: '2026-09-17T10:00:00Z' },
  ])('rejects invalid query %j', (query) => {
    expect(syncLogsQuerySchema.safeParse(query).success).toBe(false)
  })

  it('accepts equal date bounds across time zones and open-ended ranges', () => {
    const startDate = '2026-09-18T10:00:00Z'
    const endDate = '2026-09-18T12:00:00+02:00'
    for (const query of [{ startDate, endDate }, { startDate }, { endDate }]) {
      expect(syncLogsQuerySchema.safeParse(query).success).toBe(true)
    }
  })
})
