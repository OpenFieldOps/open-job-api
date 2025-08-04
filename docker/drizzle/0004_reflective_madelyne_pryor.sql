CREATE INDEX "job_start_date_idx" ON "job" USING btree ("startDate");--> statement-breakpoint
CREATE INDEX "job_end_date_idx" ON "job" USING btree ("endDate");--> statement-breakpoint
CREATE INDEX "job_date_range_idx" ON "job" USING btree ("startDate","endDate");