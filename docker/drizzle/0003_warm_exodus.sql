ALTER TABLE "job_file" ADD PRIMARY KEY ("fileId");--> statement-breakpoint
ALTER TABLE "job_file" ALTER COLUMN "fileId" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "job_assigned_to_idx" ON "job" USING btree ("assignedTo");--> statement-breakpoint
CREATE INDEX "job_created_by_idx" ON "job" USING btree ("createdBy");--> statement-breakpoint
CREATE INDEX "job_task_job_id_idx" ON "jobTask" USING btree ("jobId");--> statement-breakpoint
CREATE INDEX "notification_user_id_idx" ON "notification" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "notification_is_read_idx" ON "notification" USING btree ("is_read");