import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Env } from '@/types.js'
import type { OxeSessionManager } from '@/actions/openxeco/types.js'
import { OxeAuthenticationError } from '@/actions/openxeco/utils/openxeco-api-error.js'
import { makeLogger } from '@/actions/atlas/test-support/fakes.js'

const clientMock = vi.hoisted(() => ({
  login: vi.fn(),
  get: vi.fn(),
}))

vi.mock('@/actions/openxeco/utils/openxeco-client.js', () => ({
  OxeClient: class {
    login = clientMock.login
    get = clientMock.get
  },
}))

const appConfig: Env = {
  NODE_ENV: 'test',
  PORT: 3001,
  HOST: '127.0.0.1',
  DATABASE_URL: 'postgres://test:test@localhost:5432/test',
  JWT_SECRET: 'test-secret-that-is-at-least-32-characters',
  JWT_EXPIRES_IN: '5m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  ATLAS_BASE_URL: 'https://atlas.example/api',
  ATLAS_API_KEY: 'atlas-api-key',
  OXE_BASE_URL: 'https://openxeco.example.test/api/',
}
const logger = makeLogger().logger
const credentialsA = { email: 'a@example.test', password: 'password-a' }
const credentialsB = { email: 'b@example.test', password: 'password-b' }
const sessionA = { accessToken: 'access-a', refreshToken: 'refresh-a' }
const sessionB = { accessToken: 'access-b', refreshToken: 'refresh-b' }

describe('OxeSessionManager', () => {
  let manager: OxeSessionManager

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    clientMock.login.mockReset()
    clientMock.get.mockReset()

    const { getOxeSessionManager } = await import('@/actions/openxeco/utils/openxeco-session.js')
    manager = getOxeSessionManager({ appConfig, logger })
  })

  it('uses the session returned by login for subsequent requests', async () => {
    clientMock.login.mockResolvedValueOnce(sessionA)
    clientMock.get.mockResolvedValueOnce([{ id: 1 }])

    await manager.login('user-a', credentialsA)
    const result = await manager.get('user-a', '/form', { form_id: 11 })

    expect(clientMock.login).toHaveBeenCalledWith(credentialsA)
    expect(clientMock.get).toHaveBeenCalledWith(sessionA, '/form', { form_id: 11 })
    expect(result).toEqual([{ id: 1 }])
  })

  it('keeps concurrent logins and requests isolated by connector user', async () => {
    clientMock.login.mockImplementation(async (credentials) =>
      credentials.email === credentialsA.email ? sessionA : sessionB,
    )

    await Promise.all([manager.login('user-a', credentialsA), manager.login('user-b', credentialsB)])
    await Promise.all([manager.get('user-a', '/first'), manager.get('user-b', '/second')])

    expect(clientMock.get).toHaveBeenCalledTimes(2)
    expect(clientMock.get).toHaveBeenCalledWith(sessionA, '/first', undefined)
    expect(clientMock.get).toHaveBeenCalledWith(sessionB, '/second', undefined)
  })

  it('rejects requests for a user without a session even when another user is logged in', async () => {
    clientMock.login.mockResolvedValueOnce(sessionA)
    await manager.login('user-a', credentialsA)

    await expect(manager.get('user-b', '/resource')).rejects.toMatchObject({
      name: 'OxeAuthenticationError',
      status: 401,
    })
    expect(clientMock.get).not.toHaveBeenCalled()
  })

  it('replaces only the current user session when they log in again', async () => {
    const replacement = { accessToken: 'replacement-access', refreshToken: 'replacement-refresh' }
    clientMock.login.mockResolvedValueOnce(sessionA).mockResolvedValueOnce(sessionB).mockResolvedValueOnce(replacement)
    await manager.login('user-a', credentialsA)
    await manager.login('user-b', credentialsB)

    await manager.login('user-a', credentialsA)
    await manager.get('user-a', '/resource')
    await manager.get('user-b', '/resource')

    expect(clientMock.get).toHaveBeenCalledWith(replacement, '/resource', undefined)
    expect(clientMock.get).toHaveBeenCalledWith(sessionB, '/resource', undefined)
  })

  it('removes only the logged-out user session', async () => {
    clientMock.login.mockResolvedValueOnce(sessionA).mockResolvedValueOnce(sessionB)
    await manager.login('user-a', credentialsA)
    await manager.login('user-b', credentialsB)

    manager.logout('user-a')

    await expect(manager.get('user-a', '/resource')).rejects.toMatchObject({
      name: 'OxeAuthenticationError',
      status: 401,
    })
    expect(clientMock.get).not.toHaveBeenCalled()
    await manager.get('user-b', '/resource')
    expect(clientMock.get).toHaveBeenCalledWith(sessionB, '/resource', undefined)
  })

  it('does not create a session when login fails', async () => {
    const error = new OxeAuthenticationError()
    clientMock.login.mockRejectedValueOnce(error)

    await expect(manager.login('user-a', credentialsA)).rejects.toBe(error)
    await expect(manager.get('user-a', '/resource')).rejects.toMatchObject({
      name: 'OxeAuthenticationError',
      status: 401,
    })
    expect(clientMock.get).not.toHaveBeenCalled()
  })

  it('preserves the existing session when a replacement login fails', async () => {
    const error = new OxeAuthenticationError()
    clientMock.login.mockResolvedValueOnce(sessionA).mockRejectedValueOnce(error)
    await manager.login('user-a', credentialsA)

    await expect(manager.login('user-a', credentialsB)).rejects.toBe(error)
    await manager.get('user-a', '/resource')

    expect(clientMock.get).toHaveBeenCalledWith(sessionA, '/resource', undefined)
  })

  it('propagates authenticated request failures', async () => {
    const error = new Error('OpenXeco unavailable')
    clientMock.login.mockResolvedValueOnce(sessionA)
    clientMock.get.mockRejectedValueOnce(error)
    await manager.login('user-a', credentialsA)

    await expect(manager.get('user-a', '/resource')).rejects.toBe(error)
  })

  it('returns the same manager and retains sessions across factory calls', async () => {
    clientMock.login.mockResolvedValueOnce(sessionA)
    await manager.login('user-a', credentialsA)
    const { getOxeSessionManager } = await import('@/actions/openxeco/utils/openxeco-session.js')

    const sameManager = getOxeSessionManager({ appConfig, logger })

    expect(sameManager).toBe(manager)
    await sameManager.get('user-a', '/resource')
    expect(clientMock.get).toHaveBeenCalledWith(sessionA, '/resource', undefined)
  })

  it('starts without sessions when the module is reloaded', async () => {
    clientMock.login.mockResolvedValueOnce(sessionA)
    await manager.login('user-a', credentialsA)
    vi.resetModules()
    const { getOxeSessionManager } = await import('@/actions/openxeco/utils/openxeco-session.js')

    const restartedManager = getOxeSessionManager({ appConfig, logger })

    await expect(restartedManager.get('user-a', '/resource')).rejects.toMatchObject({
      name: 'OxeAuthenticationError',
      status: 401,
    })
    expect(clientMock.get).not.toHaveBeenCalled()
  })
})
