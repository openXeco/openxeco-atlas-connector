import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  jsonb,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('admin'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const taxonomies = pgTable(
  'taxonomies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    atlasId: varchar('atlas_id', { length: 255 }).unique(),
    taxonomyType: varchar('taxonomy_type', { length: 100 }).notNull(),
    name: varchar('name', { length: 500 }).notNull(),
    description: text('description'),
    parentId: uuid('parent_id'),
    metadata: jsonb('metadata'),
    lastSyncedAt: timestamp('last_synced_at').defaultNow(),
  },
  (table) => [
    index('taxonomy_type_idx').on(table.taxonomyType),
    index('taxonomy_atlas_id_idx').on(table.atlasId),
    index('taxonomy_parent_id_idx').on(table.parentId),
  ]
)

export const entities = pgTable(
  'entities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    atlasId: varchar('atlas_id', { length: 255 }).unique(),

    // Basic information (mandatory)
    name: varchar('name', { length: 500 }).notNull(), // title (English) *
    nameNational: varchar('name_national', { length: 400 }), // field_institution_name_in_nation *
    entityDepartment: varchar('entity_department', { length: 400 }), // field_entity_department
    description: text('description'),

    // Status and workflow
    status: varchar('status', { length: 50 }).default('draft'), // draft, ready_for_publication, published, rejected
    moderationState: varchar('moderation_state', { length: 50 }).default('draft'), // ATLAS moderation_state
    syncStatus: varchar('sync_status', { length: 50 }).default('local'),

    // Address (structured) - mandatory fields
    countryCode: varchar('country_code', { length: 2 }), // field_address.country_code *
    city: varchar('city', { length: 400 }), // field_address.locality *
    streetAddress: varchar('street_address', { length: 400 }), // field_address.address_line *
    postalCode: varchar('postal_code', { length: 20 }), // field_address.postal_code
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),

    // Organisation details (mandatory)
    email: varchar('email', { length: 255 }), // field_general_contact_e_mail *
    phone: varchar('phone', { length: 50 }), // field_phone_number
    website: varchar('website', { length: 500 }), // field_url.uri *
    registrationNumber: varchar('registration_number', { length: 100 }), // field_registration_number
    logoUrl: varchar('logo_url', { length: 500 }),

    // Headquarters information
    isHeadquarter: boolean('is_headquarter'), // field_question_headquarter *
    headquarterInfo: text('headquarter_info'), // field_headquarter (if not HQ)

    // Subsidiaries and ownership
    hasSubsidiaries: boolean('has_subsidiaries'), // field_question_subsidiaries *
    subsidiariesDetails: text('subsidiaries_details'), // field_subsidiaries_eu
    hasMajorityShares: boolean('has_majority_shares'), // field_question_majority *
    majoritySharesDetails: text('majority_shares_details'), // field_majority_shares_noneu

    // Compliance (mandatory)
    article138Compliance: boolean('article_138_compliance'), // ATLAS: field_article_136_compliance (ATLAS uses "136", local uses "138") *
    dataShareConsent: boolean('data_share_consent'), // field_data_sharing_consent *

    // Contact person / Representative (mandatory)
    contactFirstName: varchar('contact_first_name', { length: 400 }), // field_first_name *
    contactLastName: varchar('contact_last_name', { length: 400 }), // field_family_name *
    contactEmail: varchar('contact_email', { length: 255 }), // field_e_mail *
    contactPosition: varchar('contact_position', { length: 400 }), // field_position
    contactPhone: varchar('contact_phone', { length: 50 }), // field_representative_phone_numbe

    // Expertise (mandatory)
    expertiseDescription: text('expertise_description'), // field_field_of_activity_descr * (max 800 chars)
    goalsToAchieve: text('goals_to_achieve'), // field_goals_to_achieve
    goalsToContribute: text('goals_to_contribute'), // field_goals_to_contribute

    // Consent fields (ECCC form Step 4)
    dataProtectionConsent: boolean('data_protection_consent'), // GDPR disclaimer acceptance
    formCompletionConfirmed: boolean('form_completion_confirmed'), // Final submission confirmation

    // Taxonomy references (foreign keys)
    countryId: uuid('country_id').references(() => taxonomies.id),
    clusterTypeId: uuid('cluster_type_id').references(() => taxonomies.id), // field_cluster_type *
    organizationTypeId: uuid('organization_type_id').references(() => taxonomies.id),

    // System fields
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    lastSyncedAt: timestamp('last_synced_at'),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  (table) => [
    index('entity_atlas_id_idx').on(table.atlasId),
    index('entity_status_idx').on(table.status),
    index('entity_moderation_state_idx').on(table.moderationState),
    index('entity_sync_status_idx').on(table.syncStatus),
    index('entity_country_code_idx').on(table.countryCode),
    index('entity_created_by_idx').on(table.createdBy),
  ]
)

export const entityVersions = pgTable(
  'entity_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityId: uuid('entity_id')
      .notNull()
      .references(() => entities.id, { onDelete: 'cascade' }),
    version: varchar('version', { length: 50 }).notNull(),
    data: jsonb('data').notNull(),
    changedBy: uuid('changed_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('entity_version_entity_id_idx').on(table.entityId),
    index('entity_version_created_at_idx').on(table.createdAt),
  ]
)

// JRC Cybersecurity Taxonomy relationships - specific tables for each dimension
export const entityThematicAreas = pgTable(
  'entity_thematic_areas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityId: uuid('entity_id')
      .notNull()
      .references(() => entities.id, { onDelete: 'cascade' }),
    taxonomyId: uuid('taxonomy_id')
      .notNull()
      .references(() => taxonomies.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('entity_thematic_area_unique_idx').on(table.entityId, table.taxonomyId),
    index('entity_thematic_area_entity_id_idx').on(table.entityId),
    index('entity_thematic_area_taxonomy_id_idx').on(table.taxonomyId),
  ]
)

export const entitySectors = pgTable(
  'entity_sectors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityId: uuid('entity_id')
      .notNull()
      .references(() => entities.id, { onDelete: 'cascade' }),
    taxonomyId: uuid('taxonomy_id')
      .notNull()
      .references(() => taxonomies.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('entity_sector_unique_idx').on(table.entityId, table.taxonomyId),
    index('entity_sector_entity_id_idx').on(table.entityId),
    index('entity_sector_taxonomy_id_idx').on(table.taxonomyId),
  ]
)

export const entityTechnologies = pgTable(
  'entity_technologies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityId: uuid('entity_id')
      .notNull()
      .references(() => entities.id, { onDelete: 'cascade' }),
    taxonomyId: uuid('taxonomy_id')
      .notNull()
      .references(() => taxonomies.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('entity_technology_unique_idx').on(table.entityId, table.taxonomyId),
    index('entity_technology_entity_id_idx').on(table.entityId),
    index('entity_technology_taxonomy_id_idx').on(table.taxonomyId),
  ]
)

export const entityUseCases = pgTable(
  'entity_use_cases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityId: uuid('entity_id')
      .notNull()
      .references(() => entities.id, { onDelete: 'cascade' }),
    taxonomyId: uuid('taxonomy_id')
      .notNull()
      .references(() => taxonomies.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('entity_use_case_unique_idx').on(table.entityId, table.taxonomyId),
    index('entity_use_case_entity_id_idx').on(table.entityId),
    index('entity_use_case_taxonomy_id_idx').on(table.taxonomyId),
  ]
)

export const entityFieldsOfActivity = pgTable(
  'entity_fields_of_activity',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityId: uuid('entity_id')
      .notNull()
      .references(() => entities.id, { onDelete: 'cascade' }),
    taxonomyId: uuid('taxonomy_id')
      .notNull()
      .references(() => taxonomies.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('entity_field_of_activity_unique_idx').on(table.entityId, table.taxonomyId),
    index('entity_field_of_activity_entity_id_idx').on(table.entityId),
    index('entity_field_of_activity_taxonomy_id_idx').on(table.taxonomyId),
  ]
)

// Sub-domain taxonomy relationships (hierarchical - children of thematic areas)
export const entitySubDomains = pgTable(
  'entity_sub_domains',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityId: uuid('entity_id')
      .notNull()
      .references(() => entities.id, { onDelete: 'cascade' }),
    taxonomyId: uuid('taxonomy_id')
      .notNull()
      .references(() => taxonomies.id, { onDelete: 'cascade' }),
    parentDomainId: uuid('parent_domain_id').references(() => taxonomies.id), // Links to the parent thematic area
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('entity_sub_domain_unique_idx').on(table.entityId, table.taxonomyId),
    index('entity_sub_domain_entity_id_idx').on(table.entityId),
    index('entity_sub_domain_taxonomy_id_idx').on(table.taxonomyId),
    index('entity_sub_domain_parent_id_idx').on(table.parentDomainId),
  ]
)

export const syncLogs = pgTable(
  'sync_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: uuid('entity_id'),
    operation: varchar('operation', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    details: jsonb('details'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('sync_log_entity_id_idx').on(table.entityId),
    index('sync_log_entity_type_idx').on(table.entityType),
    index('sync_log_status_idx').on(table.status),
    index('sync_log_created_at_idx').on(table.createdAt),
  ]
)

export const atlasConfig = pgTable('atlas_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 255 }).unique().notNull(),
  value: text('value'),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Taxonomy = typeof taxonomies.$inferSelect
export type NewTaxonomy = typeof taxonomies.$inferInsert
export type Entity = typeof entities.$inferSelect
export type NewEntity = typeof entities.$inferInsert
export type EntityVersion = typeof entityVersions.$inferSelect
export type NewEntityVersion = typeof entityVersions.$inferInsert
export type EntityThematicArea = typeof entityThematicAreas.$inferSelect
export type NewEntityThematicArea = typeof entityThematicAreas.$inferInsert
export type EntitySector = typeof entitySectors.$inferSelect
export type NewEntitySector = typeof entitySectors.$inferInsert
export type EntityTechnology = typeof entityTechnologies.$inferSelect
export type NewEntityTechnology = typeof entityTechnologies.$inferInsert
export type EntityUseCase = typeof entityUseCases.$inferSelect
export type NewEntityUseCase = typeof entityUseCases.$inferInsert
export type EntityFieldOfActivity = typeof entityFieldsOfActivity.$inferSelect
export type NewEntityFieldOfActivity = typeof entityFieldsOfActivity.$inferInsert
export type EntitySubDomain = typeof entitySubDomains.$inferSelect
export type NewEntitySubDomain = typeof entitySubDomains.$inferInsert
export type SyncLog = typeof syncLogs.$inferSelect
export type NewSyncLog = typeof syncLogs.$inferInsert
