import Elysia, { t } from "elysia";
import { FileStorageService } from "../../services/storage/s3";
import { generateDoc } from "../../utils/doc";
import { authMacroPlugin, roleMacroPlugin } from "../auth/macro";
import { AuthModel } from "../auth/AuthModel";
import { UserModel } from "./UserModel";
import { UserService } from "./UserService";

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
      detail: generateDoc("Update User Avatar"),
    }
  )
  .post(
    "/create-user",
    async ({ body, user }) => {
      return UserService.createAssignedUser(body, user.id, body.role);
    },
    {
      body: t.Intersect([
        AuthModel.RegisterUserBody,
        t.Object({
          role: t.UnionEnum(["operator", "client", "supervisor"] as const),
        }),
      ]),
      role: "admin",
      detail: {
        summary: "Create Assigned User",
        description: "Create a new user assigned to the current user",
      },
    }
  )
  .get(
    "/get-assigned-users/:role?",
    async ({ user, params: { role } }) => {
      return UserService.fetchAssignedUsers(user.id, role);
    },
    {
      role: "admin",
      params: t.Object({
        role: t.Optional(
          t.UnionEnum(["operator", "admin", "client", "supervisor"] as const)
        ),
      }),
      detail: {
        summary: "Get Assigned Users",
        description: "Get users assigned to the current user",
      },
    }
  )
  .delete(
    "/delete-assigned-users/:userId",
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
      detail: {
        summary: "Get User Avatar",
        description: "Get user avatar URL",
      },
    }
  )
  .put(
    "/location",
    async ({ body, user }) => {
      return UserService.updateUserLocation(
        user.id,
        body.latitude,
        body.longitude
      );
    },
    {
      body: UserModel.UpdateUserLocation,
      user: true,
      detail: {
        summary: "Update User Location",
        description: "Update the current user's location",
      },
    }
  );
