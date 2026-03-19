import pino from 'pino'
import { config } from '@/config/index.js'

export const getLoggerConfigByEnv = (env: string, envLogLevel = 'info') => {
  const baseConfig = {
    level: envLogLevel,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }

  const envToLogger: Record<string, unknown> = {
    development: { ...baseConfig },
    local: { ...baseConfig },
    production: {
      level: envLogLevel,
      redact: ['req.headers.authorization'],
    },
    test: false,
  }

  return envToLogger[env] || false
}

export const getLogger = (
  env: string = config.NODE_ENV,
  logLevel = config.NODE_ENV === 'production' ? 'info' : 'debug'
) => pino(getLoggerConfigByEnv(env, logLevel))
export type Logger = ReturnType<typeof getLogger>
