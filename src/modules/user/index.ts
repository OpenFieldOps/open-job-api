import Elysia, { t } from "elysia";
import { getFileUrl } from "../../services/storage/s3";
import { authMacroPlugin } from "../auth/macro";
import { UserModel } from "./model";
import { UserService } from "./service";

export const userPlugin = new Elysia({
  name: "user",
  prefix: "/user",
  tags: ["user"],
  detail: {
    summary: "User Module",
    description:
      "Handles user-related operations such as updating user information and avatar.",
  },
})
  .use(authMacroPlugin)
  .patch("/", ({ body, user }) => UserService.updateUserInfo(body, user.id), {
    body: UserModel.UserUpdateBody,
    user: true,
    response: {
      200: t.Void(),
    },
    detail: {
      summary: "Update User Information",
      description: "Update user information",
    },
  })
  .patch(
    "/avatar",
    async ({ body: { file }, user: { id } }) =>
      UserService.updateUserAvatar(file, id),
    {
      body: UserModel.UserUpdateAvatarBody,
      user: true,
      response: {
        200: t.Void(),
      },
      detail: {
        summary: "Update User Avatar",
        description: "Update user avatar",
      },
    }
  )
  .get(
    "/avatar",
    ({ user }) => {
      console.log(user.avatar);
      return user.avatar ? getFileUrl(user.avatar) : "";
    },
    {
      user: true,
      response: {
        200: t.String(),
      },
      detail: {
        summary: "Get User Avatar",
        description: "Get user avatar URL",
      },
    }
  );
