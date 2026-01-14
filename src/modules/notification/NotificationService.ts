import { and, eq } from "drizzle-orm";
import { db } from "../../services/db/db";
import { notificationTable } from "../../services/db/schema";
import type { UserNotificationModel } from "./NotificationModel";

export abstract class UserNotificationService {
  static async sendNotification(
    userId: number,
    body: UserNotificationModel.UserNotificationCreate
  ) {
    await db.insert(notificationTable).values({
      ...body,
      userId,
    });
  }

  static async fetchUserNotifications(userId: number) {
    return await db
      .select()
      .from(notificationTable)
      .where(eq(notificationTable.userId, userId));
  }

  static async deleteAllNotifications(userId: number) {
    return await db
      .delete(notificationTable)
      .where(eq(notificationTable.userId, userId));
  }

  static async markAllNotificationsAsRead(userId: number) {
    return await db
      .update(notificationTable)
      .set({ isRead: true })
      .where(eq(notificationTable.userId, userId));
  }

  static async markNotificationAsRead(userId: number, notificationId: number) {
    return await db
      .update(notificationTable)
      .set({ isRead: true })
      .where(
        and(
          eq(notificationTable.userId, userId),
          eq(notificationTable.id, notificationId)
        )
      );
  }
}
