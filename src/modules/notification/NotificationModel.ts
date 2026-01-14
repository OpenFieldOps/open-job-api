import { t } from "elysia";
import type { notificationTable } from "../../services/db/schema";

export namespace UserNotificationModel {
  export enum UserNotificationType {
    JobAssigned = "job_assigned",
    JobUpdated = "job_updated",
    JobCompleted = "job_completed",
    SystemMessage = "system_message",
  }

  export const userNotificationType = t.Enum(UserNotificationType);

  export const userNotificationCreate = t.Object({
    title: t.String(),
    message: t.String(),
    type: userNotificationType,
    payload: t.Optional(t.Any()),
  });

  export type UserNotificationInterventionPayload = {
    jobId: number;
  };

  export type UserNotification = typeof notificationTable.$inferSelect;

  export type UserNotificationCreate = typeof userNotificationCreate.static;
}
