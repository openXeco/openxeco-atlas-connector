import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  jsonb,
  index,
  uniqueIndex,
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
}, (table) => ({
  taxonomyTypeIdx: index('taxonomy_type_idx').on(table.taxonomyType),
  atlasIdIdx: index('taxonomy_atlas_id_idx').on(table.atlasId),
  parentIdIdx: index('taxonomy_parent_id_idx').on(table.parentId),
}));

export const entities = pgTable('entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  atlasId: varchar('atlas_id', { length: 255 }).unique(),
  name: varchar('name', { length: 500 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('draft'),
  syncStatus: varchar('sync_status', { length: 50 }).default('local'),
  countryId: uuid('country_id').references(() => taxonomies.id),
  clusterTypeId: uuid('cluster_type_id').references(() => taxonomies.id),
  legalStatusId: uuid('legal_status_id').references(() => taxonomies.id),
  organizationTypeId: uuid('organization_type_id').references(() => taxonomies.id),
  logoUrl: varchar('logo_url', { length: 500 }),
  website: varchar('website', { length: 500 }),
  address: text('address'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastSyncedAt: timestamp('last_synced_at'),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
  atlasIdIdx: index('entity_atlas_id_idx').on(table.atlasId),
  statusIdx: index('entity_status_idx').on(table.status),
  syncStatusIdx: index('entity_sync_status_idx').on(table.syncStatus),
  createdByIdx: index('entity_created_by_idx').on(table.createdBy),
}));

export const entityVersions = pgTable('entity_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull().references(() => entities.id, { onDelete: 'cascade' }),
  version: varchar('version', { length: 50 }).notNull(),
  data: jsonb('data').notNull(),
  changedBy: uuid('changed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  entityIdIdx: index('entity_version_entity_id_idx').on(table.entityId),
  createdAtIdx: index('entity_version_created_at_idx').on(table.createdAt),
}));

export const entityTaxonomies = pgTable('entity_taxonomies', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull().references(() => entities.id, { onDelete: 'cascade' }),
  taxonomyId: uuid('taxonomy_id').notNull().references(() => taxonomies.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  entityTaxonomyIdx: uniqueIndex('entity_taxonomy_unique_idx').on(table.entityId, table.taxonomyId),
  entityIdIdx: index('entity_taxonomy_entity_id_idx').on(table.entityId),
  taxonomyIdIdx: index('entity_taxonomy_taxonomy_id_idx').on(table.taxonomyId),
}));

export const syncLogs = pgTable('sync_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: uuid('entity_id'),
  operation: varchar('operation', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  entityTypeIdx: index('sync_log_entity_type_idx').on(table.entityType),
  statusIdx: index('sync_log_status_idx').on(table.status),
  createdAtIdx: index('sync_log_created_at_idx').on(table.createdAt),
}));

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
