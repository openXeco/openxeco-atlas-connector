import type { AtlasClient } from '@/actions/atlas/types.js'
import type { DB, Logger } from '@/types.js'
import { vi, type Mock } from 'vitest'

type AtlasClientFake = {
  client: AtlasClient
  get: Mock
  post: Mock
  patch: Mock
  put: Mock
}

type LoggerFake = {
  logger: Logger
  info: Mock
  warn: Mock
  error: Mock
}

export const makeAtlasClient = (): AtlasClientFake => {
  const get = vi.fn()
  const post = vi.fn()
  const patch = vi.fn()
  const put = vi.fn()

  return {
    client: { get, post, patch, put } as unknown as AtlasClient,
    get,
    post,
    patch,
    put,
  }
}

export const makeLogger = (): LoggerFake => {
  const info = vi.fn()
  const warn = vi.fn()
  const error = vi.fn()

  return {
    logger: { info, warn, error } as unknown as Logger,
    info,
    warn,
    error,
  }
}

export const makeDb = () => ({}) as DB
