import Elysia, { t } from "elysia";
import { authMacroPlugin } from "../auth/macro";
import { UserNotificationSerice } from "./NotificationService";

export const userNotificationPlugin = new Elysia({
  name: "notification",
  prefix: "notification",
})
  .use(authMacroPlugin)
  .get(
    "/",
    async ({ user }) => UserNotificationSerice.fetchUserNotifications(user.id),
    {
      user: true,
    }
  )
  .delete(
    "/",
    async ({ user }) => UserNotificationSerice.deleteAllNotifications(user.id),
    {
      user: true,
    }
  )
  .put(
    "/read",
    async ({ user }) =>
      UserNotificationSerice.markAllNotificationsAsRead(user.id),
    {
      user: true,
    }
  )
  .put(
    "/read/:id",
    async ({ user, params }) =>
      UserNotificationSerice.markNotificationAsRead(user.id, params.id),
    {
      user: true,
      params: t.Object({
        id: t.Number(),
      }),
    }
  );
