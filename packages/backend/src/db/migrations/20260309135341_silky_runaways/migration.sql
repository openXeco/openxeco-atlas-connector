ALTER TABLE "entities" DROP COLUMN "other_sectors";--> statement-breakpoint
ALTER TABLE "entities" DROP COLUMN "other_technologies";--> statement-breakpoint
ALTER TABLE "entities" DROP COLUMN "other_use_cases";--> statement-breakpoint
CREATE INDEX "sync_log_entity_id_idx" ON "sync_logs" ("entity_id");