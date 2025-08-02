import Elysia from "elysia";
import { authMacroPlugin } from "../auth/macro";
import { UserNotificationSerice } from "./service";

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
  );
