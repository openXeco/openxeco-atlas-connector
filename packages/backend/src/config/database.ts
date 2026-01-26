import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema.js';
import { config } from './index.js';

const queryClient = postgres(config.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(config.DATABASE_URL, { schema });

export async function closeDatabase(): Promise<void> {
  await queryClient.end();
}
