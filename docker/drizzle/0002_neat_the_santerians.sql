DROP TABLE "account" CASCADE;--> statement-breakpoint
DROP TABLE "session" CASCADE;--> statement-breakpoint
DROP TABLE "user" CASCADE;--> statement-breakpoint
DROP TABLE "verification" CASCADE;--> statement-breakpoint
ALTER TABLE "job" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "job" ALTER COLUMN "status" SET DEFAULT 'scheduled'::text;--> statement-breakpoint
DROP TYPE "public"."job_status";--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('scheduled', 'pending', 'inProgress', 'completed');--> statement-breakpoint
ALTER TABLE "job" ALTER COLUMN "status" SET DEFAULT 'scheduled'::"public"."job_status";--> statement-breakpoint
ALTER TABLE "job" ALTER COLUMN "status" SET DATA TYPE "public"."job_status" USING "status"::"public"."job_status";