import Elysia, { t } from "elysia";
import { authMacroPlugin } from "../auth/macro";
import { UserNotificationService } from "./NotificationService";

export const userNotificationPlugin = new Elysia({
  name: "notification",
  prefix: "/notification",
  tags: ["notification"],
  aot: true,
})
  .use(authMacroPlugin)
  .get(
    "/",
    async ({ user }) => UserNotificationService.fetchUserNotifications(user.id),
    {
      user: true,
    }
  )
  .delete(
    "/",
    async ({ user }) => UserNotificationService.deleteAllNotifications(user.id),
    {
      user: true,
    }
  )
  .put(
    "/read",
    async ({ user }) =>
      UserNotificationService.markAllNotificationsAsRead(user.id),
    {
      user: true,
    }
  )
  .put(
    "/read/:id",
    async ({ user, params }) =>
      UserNotificationService.markNotificationAsRead(user.id, params.id),
    {
      user: true,
      params: t.Object({
        id: t.Number(),
      }),
    }
  );
