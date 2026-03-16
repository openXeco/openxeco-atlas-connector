ALTER TABLE "entities" DROP CONSTRAINT "entities_created_by_users_id_fkey";--> statement-breakpoint
ALTER TABLE "entities" DROP CONSTRAINT "entities_updated_by_users_id_fkey";--> statement-breakpoint
ALTER TABLE "entity_versions" DROP CONSTRAINT "entity_versions_changed_by_users_id_fkey";--> statement-breakpoint
DROP INDEX "entity_created_by_idx";--> statement-breakpoint
ALTER TABLE "entities" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "entities" DROP COLUMN "updated_by";--> statement-breakpoint
ALTER TABLE "entity_versions" DROP COLUMN "changed_by";