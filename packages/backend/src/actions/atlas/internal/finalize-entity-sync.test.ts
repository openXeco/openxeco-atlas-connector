import { describe, expect, it, vi } from 'vitest'

import { finalizeEntitySyncFailure } from '@/actions/atlas/internal/finalize-entity-sync.js'
import { makeLogger } from '@/actions/atlas/test-support/fakes.js'
import { entities, syncLogs } from '@/db/schema.js'
import { AtlasApiError } from '@/actions/atlas/utils/atlas-api-error.js'
import type { DB } from '@/types.js'

describe('finalizeEntitySyncFailure', () => {
  const errors = [
    {
      id: 'error-1',
      status: '422',
      code: 'invalid',
      title: 'Invalid email',
      detail: 'Provide a valid email address.',
      source: { pointer: '/data/attributes/email' },
    },
    { status: '422', title: 'Unknown country', source: { parameter: 'country' } },
  ]

  describe.each(['failed', 'not_found'] as const)('%s outcome', (outcome) => {
    it.each([
      {
        error: new AtlasApiError('Validation failed', 422, errors),
        errorMessage: 'Validation failed',
        errorDetails: errors,
      },
      { error: new AtlasApiError('Unavailable', 503, []), errorMessage: 'Unavailable', errorDetails: [] },
      { error: new AtlasApiError('Unavailable', 503), errorMessage: 'Unavailable', errorDetails: undefined },
      { error: new Error('Connection interrupted'), errorMessage: 'Connection interrupted', errorDetails: undefined },
      { error: undefined, errorMessage: undefined, errorDetails: undefined },
    ])(
      'records errorMessage=$errorMessage and errorDetails=$errorDetails',
      async ({ error, errorMessage, errorDetails }) => {
        const where = vi.fn().mockResolvedValue(undefined)
        const set = vi.fn().mockReturnValue({ where })
        const update = vi.fn().mockReturnValue({ set })
        const values = vi.fn().mockResolvedValue(undefined)
        const insert = vi.fn().mockReturnValue({ values })
        const tx = { update, insert } as unknown as DB
        const transaction = vi.fn(async (callback: (transactionDb: DB) => unknown) => callback(tx))
        const db = { transaction } as unknown as DB

        await finalizeEntitySyncFailure('create', outcome, 'entity-1', undefined, error, db, makeLogger().logger)

        expect(transaction).toHaveBeenCalledOnce()
        expect(update).toHaveBeenCalledWith(entities)
        expect(set).toHaveBeenCalledWith({
          syncStatus: 'failed',
          syncCode: outcome === 'not_found' ? 'not_found' : null,
          updatedAt: expect.any(Date),
        })
        expect(insert).toHaveBeenCalledWith(syncLogs)
        expect(values).toHaveBeenCalledExactlyOnceWith({
          entityType: 'entity',
          entityId: 'entity-1',
          operation: 'create',
          status: 'failed',
          details: {
            atlasId: undefined,
            syncCode: outcome === 'not_found' ? 'not_found' : undefined,
            conflictFields: undefined,
            errorMessage,
            errorDetails,
          },
        })
        const details = values.mock.calls[0]?.[0].details
        expect(details.errorDetails).toBe(error instanceof AtlasApiError ? error.errors : undefined)
        const storedDetails = JSON.parse(JSON.stringify(details))
        if (errorDetails === undefined) {
          expect(storedDetails).not.toHaveProperty('errorDetails')
        } else {
          expect(storedDetails.errorDetails).toEqual(errorDetails)
        }
      },
    )
  })
})
