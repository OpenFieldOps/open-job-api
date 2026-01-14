import { t } from "elysia";
import { userAdminTable, userTable } from "../../services/db/schema";
import { FileMb } from "../../utils/file";

export namespace UserModel {
  export enum UserRoleEnum {
    admin = "admin",
    operator = "operator",
    client = "client",
    supervisor = "supervisor",
  }

  export type UserRole = `${UserRoleEnum}`;

  export type AssignedUserRole = Exclude<UserRole, "admin">;

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
    phone: t.String(),
    avatar: t.Union([t.String(), t.Null()]),
    role: t.UnionEnum(["admin", "operator", "client", "supervisor"] as const),
    lastSeen: t.String(),
    pricingModel: t.Optional(t.Nullable(t.Number())),
    chatId: t.Number(),
  });

  export const userTableSelectFields = {
    id: userTable.id,
    username: userTable.username,
    email: userTable.email,
    firstName: userTable.firstName,
    lastName: userTable.lastName,
    avatar: userTable.avatar,
    role: userTable.role,
    lastSeen: userTable.lastSeen,
    phone: userTable.phone,
    pricingModel: userTable.pricingModel,
  };

  export const userWithoutPasswordSelectFields = {
    ...userTableSelectFields,
    chatId: userAdminTable.chatId,
  };

  export const UserInfo = UserWithoutPassword;

  export const UserUpdateBody = t.Object({
    firstName: t.String(),
    lastName: t.String(),
    phone: t.String(),
  });
  export const UpdateUserLocation = t.Object({
    latitude: t.Number(),
    longitude: t.Number(),
  });
  export type UserUpdateBody = typeof UserUpdateBody.$infer;
  export const UserUpdateAvatarBody = t.Object({
    file: t.File({
      maxSize: 10 * FileMb,
    }),
  });
  export type User = typeof userTable.$inferSelect & { chatId: number };
  export type UserWithoutPassword = Omit<User, "password">;
}
