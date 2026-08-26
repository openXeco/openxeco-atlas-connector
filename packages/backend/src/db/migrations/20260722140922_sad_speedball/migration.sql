DROP INDEX "entity_moderation_state_idx";--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN "sync_code" varchar(50);--> statement-breakpoint

UPDATE "entities"
SET "status" = COALESCE("moderation_state", "status", 'draft');

ALTER TABLE "entities" DROP COLUMN "moderation_state";--> statement-breakpoint
ALTER TABLE "entities" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "entities" ALTER COLUMN "sync_status" SET DEFAULT 'pending_push';--> statement-breakpoint
ALTER TABLE "entities" ALTER COLUMN "sync_status" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "entity_sync_sync_code_idx" ON "entities" ("sync_code");

UPDATE "entities"
SET "sync_status" = 'pending_push'
WHERE "sync_status" = 'local';

UPDATE "entities"
SET
    "sync_code" = 'not_found'
WHERE "sync_status" = 'failed';

UPDATE "entities"
SET
    "sync_status" = 'failed',
    "sync_code" = 'conflict'
WHERE "sync_status" = 'conflict';
