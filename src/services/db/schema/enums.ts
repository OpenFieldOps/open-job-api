import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", [
  "operator",
  "admin",
  "client",
  "supervisor",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "job_assigned",
  "job_updated",
  "job_completed",
  "system_message",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "scheduled",
  "pending",
  "inProgress",
  "completed",
]);
