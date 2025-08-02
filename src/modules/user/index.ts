import Elysia, { t } from "elysia";
import { FileStorageService } from "../../services/storage/s3";
import { generateDoc } from "../../utils/doc";
import { authMacroPlugin, roleMacroPlugin } from "../auth/macro";
import { AuthModel } from "../auth/model";
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
  .use(roleMacroPlugin)
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
        200: t.String(),
      },
      detail: generateDoc("Update User Avatar"),
    }
  )
  .post(
    "/create-user",
    async ({ body, user }) => {
      return UserService.createAssignedUser(body, user.id);
    },
    {
      body: AuthModel.RegisterUserBody,
      role: "admin",

      detail: {
        summary: "Create Assigned User",
        description: "Create a new user assigned to the current user",
      },
    }
  )
  .get(
    "/assigned-users",
    async ({ user }) => {
      return UserService.fetchAssignedUsers(user.id);
    },
    {
      role: "admin",
      detail: {
        summary: "Get Assigned Users",
        description: "Get users assigned to the current user",
      },
    }
  )
  .delete(
    "/assigned-users/:userId",
    async ({ params: { userId }, user }) => {
      return UserService.deleteAssignedUser(user.id, userId);
    },
    {
      params: t.Object({
        userId: t.Number(),
      }),
      role: "admin",
      detail: {
        summary: "Delete Assigned User",
        description: "Delete a user assigned to the current user",
      },
    }
  )
  .get(
    "/avatar",
    ({ user }) => {
      return user.avatar ? FileStorageService.getFileUrl(user.avatar) : "";
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
