import { OxeClient } from '@/actions/openxeco/utils/openxeco-client.js'
import type { OxeSession, OxeCredentials, OxeQueryParams, OxeClientConfig } from '@/actions/openxeco/types.js'
import { OxeAuthenticationError } from '@/actions/openxeco/utils/openxeco-api-error.js'
import type { Env, Logger } from '@/types.js'

class OxeSessionManager {
  private readonly sessions = new Map<string, OxeSession>()

  constructor(private readonly client: OxeClient) {}

  async login(userId: string, credentials: OxeCredentials): Promise<void> {
    const session = await this.client.login(credentials)
    this.sessions.set(userId, session)
  }

  async get<R>(userId: string, path: string, params?: OxeQueryParams): Promise<R> {
    const session = this.sessions.get(userId)

    if (!session) {
      throw new OxeAuthenticationError()
    }

    return await this.client.get<R>(session, path, params)
  }

  logout(userId: string): void {
    this.sessions.delete(userId)
  }
}

let oxeSessionManager: OxeSessionManager | undefined

export const getOxeSessionManager = ({
  appConfig,
  logger,
  overrideOxeConfig,
}: {
  appConfig: Env
  logger: Logger
  overrideOxeConfig?: OxeClientConfig
}) => {
  if (!oxeSessionManager) {
    const config: OxeClientConfig = {
      baseUrl: new URL(appConfig.OXE_BASE_URL),
      httpsProxy: appConfig.HTTPS_PROXY,
      ...overrideOxeConfig,
    }

    config.baseUrl.pathname = `${config.baseUrl.pathname.replace(/\/+$/, '')}/`
    config.baseUrl.search = ''
    config.baseUrl.hash = ''

    const client = new OxeClient(config, logger)
    oxeSessionManager = new OxeSessionManager(client)
  }

  return oxeSessionManager
}
