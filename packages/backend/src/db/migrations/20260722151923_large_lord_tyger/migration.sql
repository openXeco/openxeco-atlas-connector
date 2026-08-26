ALTER TABLE "entities" ALTER COLUMN "status" SET DATA TYPE varchar USING "status"::varchar;--> statement-breakpoint
ALTER TABLE "entities" ALTER COLUMN "sync_status" SET DATA TYPE varchar USING "sync_status"::varchar;--> statement-breakpoint
ALTER TABLE "entities" ALTER COLUMN "sync_code" SET DATA TYPE varchar USING "sync_code"::varchar;