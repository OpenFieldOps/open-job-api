import { t } from "elysia";
import type { userTable } from "../../services/db/schema";
import { FileMb } from "../../utils/file";

export namespace UserModel {
  export enum UserRoleEnum {
    admin = "admin",
    user = "operator",
    client = "client",
  }

  export type UserRole = `${UserRoleEnum}`;

  export const UserInfo = t.Object({
    id: t.Number(),
    username: t.String(),
    email: t.String(),
    firstName: t.String(),
    lastName: t.String(),
    avatar: t.Union([t.String(), t.Null()]),
  });

  export type UserInfo = typeof UserInfo.static;

  export type UserIdAndRole = {
    id: number;
    role: UserModel.UserRole;
  };

  export const UserWithoutPassword = t.Object({
    id: t.Number(),
    username: t.String(),
    email: t.String(),
    firstName: t.String(),
    lastName: t.String(),
    avatar: t.Union([t.String(), t.Null()]),
    role: t.UnionEnum(["admin", "operator", "client"] as const),
  });

  export const UserUpdateBody = t.Object({
    firstName: t.String(),
    lastName: t.String(),
  });
  export type UserUpdateBody = typeof UserUpdateBody.$infer;
  export const UserUpdateAvatarBody = t.Object({
    file: t.File({
      maxSize: 10 * FileMb,
    }),
  });
  export type User = typeof userTable.$inferSelect;
  export type UserWithoutPassword = Omit<User, "password">;
}
