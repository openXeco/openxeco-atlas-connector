import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  jsonb,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('admin'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const taxonomies = pgTable('taxonomies', {
  id: uuid('id').primaryKey().defaultRandom(),
  atlasId: varchar('atlas_id', { length: 255 }).unique(),
  taxonomyType: varchar('taxonomy_type', { length: 100 }).notNull(),
  name: varchar('name', { length: 500 }).notNull(),
  description: text('description'),
  parentId: uuid('parent_id'),
  metadata: jsonb('metadata'),
  lastSyncedAt: timestamp('last_synced_at').defaultNow(),
});

export const entities = pgTable('entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  atlasId: varchar('atlas_id', { length: 255 }).unique(),
  name: varchar('name', { length: 500 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('draft'),
  syncStatus: varchar('sync_status', { length: 50 }).default('local'),
  countryId: uuid('country_id'),
  clusterTypeId: uuid('cluster_type_id'),
  legalStatusId: uuid('legal_status_id'),
  organizationTypeId: uuid('organization_type_id'),
  logoUrl: varchar('logo_url', { length: 500 }),
  website: varchar('website', { length: 500 }),
  address: text('address'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastSyncedAt: timestamp('last_synced_at'),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
});

export const entityVersions = pgTable('entity_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  data: jsonb('data').notNull(),
  changedBy: uuid('changed_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const entityTaxonomies = pgTable('entity_taxonomies', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull(),
  taxonomyId: uuid('taxonomy_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const syncLogs = pgTable('sync_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: uuid('entity_id'),
  operation: varchar('operation', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const atlasConfig = pgTable('atlas_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 255 }).unique().notNull(),
  value: text('value'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Taxonomy = typeof taxonomies.$inferSelect;
export type NewTaxonomy = typeof taxonomies.$inferInsert;
export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
export type EntityVersion = typeof entityVersions.$inferSelect;
export type NewEntityVersion = typeof entityVersions.$inferInsert;
export type SyncLog = typeof syncLogs.$inferSelect;
export type NewSyncLog = typeof syncLogs.$inferInsert;
