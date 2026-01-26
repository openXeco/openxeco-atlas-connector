CREATE TABLE IF NOT EXISTS "atlas_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"key" varchar(255) NOT NULL UNIQUE,
	"value" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"atlas_id" varchar(255) UNIQUE,
	"name" varchar(500) NOT NULL,
	"name_national" varchar(400),
	"entity_department" varchar(400),
	"description" text,
	"status" varchar(50) DEFAULT 'draft',
	"moderation_state" varchar(50) DEFAULT 'draft',
	"sync_status" varchar(50) DEFAULT 'local',
	"country_code" varchar(2),
	"city" varchar(400),
	"street_address" varchar(400),
	"postal_code" varchar(20),
	"latitude" numeric(10,8),
	"longitude" numeric(11,8),
	"email" varchar(255),
	"phone" varchar(50),
	"website" varchar(500),
	"registration_number" varchar(100),
	"logo_url" varchar(500),
	"is_headquarter" boolean,
	"headquarter_info" text,
	"has_subsidiaries" boolean,
	"subsidiaries_details" text,
	"has_majority_shares" boolean,
	"majority_shares_details" text,
	"article_138_compliance" boolean,
	"data_share_consent" boolean,
	"contact_first_name" varchar(400),
	"contact_last_name" varchar(400),
	"contact_email" varchar(255),
	"contact_position" varchar(400),
	"contact_phone" varchar(50),
	"expertise_description" text,
	"goals_to_achieve" text,
	"goals_to_contribute" text,
	"country_id" uuid,
	"cluster_type_id" uuid,
	"organization_type_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_synced_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "name_national" varchar(400);--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "entity_department" varchar(400);--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "moderation_state" varchar(50) DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "country_code" varchar(2);--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "city" varchar(400);--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "street_address" varchar(400);--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "email" varchar(255);--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "registration_number" varchar(100);--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "is_headquarter" boolean;--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "headquarter_info" text;--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "has_subsidiaries" boolean;--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "subsidiaries_details" text;--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "has_majority_shares" boolean;--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "majority_shares_details" text;--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "article_138_compliance" boolean;--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "data_share_consent" boolean;--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "contact_first_name" varchar(400);--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "contact_last_name" varchar(400);--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "contact_email" varchar(255);--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "contact_position" varchar(400);--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "contact_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "expertise_description" text;--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "goals_to_achieve" text;--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "goals_to_contribute" text;--> statement-breakpoint
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entity_fields_of_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"entity_id" uuid NOT NULL,
	"taxonomy_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entity_sectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"entity_id" uuid NOT NULL,
	"taxonomy_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entity_technologies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"entity_id" uuid NOT NULL,
	"taxonomy_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entity_thematic_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"entity_id" uuid NOT NULL,
	"taxonomy_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entity_use_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"entity_id" uuid NOT NULL,
	"taxonomy_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entity_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"entity_id" uuid NOT NULL,
	"version" varchar(50) NOT NULL,
	"data" jsonb NOT NULL,
	"changed_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid,
	"operation" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "taxonomies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"atlas_id" varchar(255) UNIQUE,
	"taxonomy_type" varchar(100) NOT NULL,
	"name" varchar(500) NOT NULL,
	"description" text,
	"parent_id" uuid,
	"metadata" jsonb,
	"last_synced_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" varchar(255) NOT NULL UNIQUE,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'admin',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_atlas_id_idx') THEN
    EXECUTE 'CREATE INDEX entity_atlas_id_idx ON entities (atlas_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_status_idx') THEN
    EXECUTE 'CREATE INDEX entity_status_idx ON entities (status)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_moderation_state_idx') THEN
    EXECUTE 'CREATE INDEX entity_moderation_state_idx ON entities (moderation_state)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_sync_status_idx') THEN
    EXECUTE 'CREATE INDEX entity_sync_status_idx ON entities (sync_status)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_country_code_idx') THEN
    EXECUTE 'CREATE INDEX entity_country_code_idx ON entities (country_code)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_created_by_idx') THEN
    EXECUTE 'CREATE INDEX entity_created_by_idx ON entities (created_by)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_field_of_activity_unique_idx') THEN
    EXECUTE 'CREATE UNIQUE INDEX entity_field_of_activity_unique_idx ON entity_fields_of_activity (entity_id, taxonomy_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_field_of_activity_entity_id_idx') THEN
    EXECUTE 'CREATE INDEX entity_field_of_activity_entity_id_idx ON entity_fields_of_activity (entity_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_field_of_activity_taxonomy_id_idx') THEN
    EXECUTE 'CREATE INDEX entity_field_of_activity_taxonomy_id_idx ON entity_fields_of_activity (taxonomy_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_sector_unique_idx') THEN
    EXECUTE 'CREATE UNIQUE INDEX entity_sector_unique_idx ON entity_sectors (entity_id, taxonomy_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_sector_entity_id_idx') THEN
    EXECUTE 'CREATE INDEX entity_sector_entity_id_idx ON entity_sectors (entity_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_sector_taxonomy_id_idx') THEN
    EXECUTE 'CREATE INDEX entity_sector_taxonomy_id_idx ON entity_sectors (taxonomy_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_technology_unique_idx') THEN
    EXECUTE 'CREATE UNIQUE INDEX entity_technology_unique_idx ON entity_technologies (entity_id, taxonomy_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_technology_entity_id_idx') THEN
    EXECUTE 'CREATE INDEX entity_technology_entity_id_idx ON entity_technologies (entity_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_technology_taxonomy_id_idx') THEN
    EXECUTE 'CREATE INDEX entity_technology_taxonomy_id_idx ON entity_technologies (taxonomy_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_thematic_area_unique_idx') THEN
    EXECUTE 'CREATE UNIQUE INDEX entity_thematic_area_unique_idx ON entity_thematic_areas (entity_id, taxonomy_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_thematic_area_entity_id_idx') THEN
    EXECUTE 'CREATE INDEX entity_thematic_area_entity_id_idx ON entity_thematic_areas (entity_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_thematic_area_taxonomy_id_idx') THEN
    EXECUTE 'CREATE INDEX entity_thematic_area_taxonomy_id_idx ON entity_thematic_areas (taxonomy_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_use_case_unique_idx') THEN
    EXECUTE 'CREATE UNIQUE INDEX entity_use_case_unique_idx ON entity_use_cases (entity_id, taxonomy_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_use_case_entity_id_idx') THEN
    EXECUTE 'CREATE INDEX entity_use_case_entity_id_idx ON entity_use_cases (entity_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_use_case_taxonomy_id_idx') THEN
    EXECUTE 'CREATE INDEX entity_use_case_taxonomy_id_idx ON entity_use_cases (taxonomy_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_version_entity_id_idx') THEN
    EXECUTE 'CREATE INDEX entity_version_entity_id_idx ON entity_versions (entity_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'entity_version_created_at_idx') THEN
    EXECUTE 'CREATE INDEX entity_version_created_at_idx ON entity_versions (created_at)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'sync_log_entity_type_idx') THEN
    EXECUTE 'CREATE INDEX sync_log_entity_type_idx ON sync_logs (entity_type)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'sync_log_status_idx') THEN
    EXECUTE 'CREATE INDEX sync_log_status_idx ON sync_logs (status)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'sync_log_created_at_idx') THEN
    EXECUTE 'CREATE INDEX sync_log_created_at_idx ON sync_logs (created_at)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'taxonomy_type_idx') THEN
    EXECUTE 'CREATE INDEX taxonomy_type_idx ON taxonomies (taxonomy_type)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'taxonomy_atlas_id_idx') THEN
    EXECUTE 'CREATE INDEX taxonomy_atlas_id_idx ON taxonomies (atlas_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'taxonomy_parent_id_idx') THEN
    EXECUTE 'CREATE INDEX taxonomy_parent_id_idx ON taxonomies (parent_id)';
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entities_country_id_taxonomies_id_fkey') THEN
    ALTER TABLE "entities" ADD CONSTRAINT "entities_country_id_taxonomies_id_fkey" FOREIGN KEY ("country_id") REFERENCES "taxonomies"("id");
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entities_cluster_type_id_taxonomies_id_fkey') THEN
    ALTER TABLE "entities" ADD CONSTRAINT "entities_cluster_type_id_taxonomies_id_fkey" FOREIGN KEY ("cluster_type_id") REFERENCES "taxonomies"("id");
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entities_organization_type_id_taxonomies_id_fkey') THEN
    ALTER TABLE "entities" ADD CONSTRAINT "entities_organization_type_id_taxonomies_id_fkey" FOREIGN KEY ("organization_type_id") REFERENCES "taxonomies"("id");
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entities_created_by_users_id_fkey') THEN
    ALTER TABLE "entities" ADD CONSTRAINT "entities_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entities_updated_by_users_id_fkey') THEN
    ALTER TABLE "entities" ADD CONSTRAINT "entities_updated_by_users_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entity_fields_of_activity_entity_id_entities_id_fkey') THEN
    ALTER TABLE "entity_fields_of_activity" ADD CONSTRAINT "entity_fields_of_activity_entity_id_entities_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entity_fields_of_activity_taxonomy_id_taxonomies_id_fkey') THEN
    ALTER TABLE "entity_fields_of_activity" ADD CONSTRAINT "entity_fields_of_activity_taxonomy_id_taxonomies_id_fkey" FOREIGN KEY ("taxonomy_id") REFERENCES "taxonomies"("id") ON DELETE CASCADE;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entity_sectors_entity_id_entities_id_fkey') THEN
    ALTER TABLE "entity_sectors" ADD CONSTRAINT "entity_sectors_entity_id_entities_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entity_sectors_taxonomy_id_taxonomies_id_fkey') THEN
    ALTER TABLE "entity_sectors" ADD CONSTRAINT "entity_sectors_taxonomy_id_taxonomies_id_fkey" FOREIGN KEY ("taxonomy_id") REFERENCES "taxonomies"("id") ON DELETE CASCADE;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entity_technologies_entity_id_entities_id_fkey') THEN
    ALTER TABLE "entity_technologies" ADD CONSTRAINT "entity_technologies_entity_id_entities_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entity_technologies_taxonomy_id_taxonomies_id_fkey') THEN
    ALTER TABLE "entity_technologies" ADD CONSTRAINT "entity_technologies_taxonomy_id_taxonomies_id_fkey" FOREIGN KEY ("taxonomy_id") REFERENCES "taxonomies"("id") ON DELETE CASCADE;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entity_thematic_areas_entity_id_entities_id_fkey') THEN
    ALTER TABLE "entity_thematic_areas" ADD CONSTRAINT "entity_thematic_areas_entity_id_entities_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entity_thematic_areas_taxonomy_id_taxonomies_id_fkey') THEN
    ALTER TABLE "entity_thematic_areas" ADD CONSTRAINT "entity_thematic_areas_taxonomy_id_taxonomies_id_fkey" FOREIGN KEY ("taxonomy_id") REFERENCES "taxonomies"("id") ON DELETE CASCADE;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entity_use_cases_entity_id_entities_id_fkey') THEN
    ALTER TABLE "entity_use_cases" ADD CONSTRAINT "entity_use_cases_entity_id_entities_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entity_use_cases_taxonomy_id_taxonomies_id_fkey') THEN
    ALTER TABLE "entity_use_cases" ADD CONSTRAINT "entity_use_cases_taxonomy_id_taxonomies_id_fkey" FOREIGN KEY ("taxonomy_id") REFERENCES "taxonomies"("id") ON DELETE CASCADE;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entity_versions_entity_id_entities_id_fkey') THEN
    ALTER TABLE "entity_versions" ADD CONSTRAINT "entity_versions_entity_id_entities_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entity_versions_changed_by_users_id_fkey') THEN
    ALTER TABLE "entity_versions" ADD CONSTRAINT "entity_versions_changed_by_users_id_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id");
  END IF;
END $$;