import z from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('5m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  ATLAS_BASE_URL: z.string().url(),
  ATLAS_API_KEY: z.string().min(1),
  ATLAS_USERNAME: z.string().optional(),
  ATLAS_PASSWORD: z.string().optional(),

  FRONTEND_URL: z.string().url().optional(),

  HTTPS_PROXY: z.string().url().optional(),
})
