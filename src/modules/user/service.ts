import { and, eq, inArray, not } from "drizzle-orm";
import { db } from "../../services/db/db";
import { userAdminTable, userTable } from "../../services/db/schema";
import { FileStorageService } from "../../services/storage/s3";
import { AppError } from "../../utils/error";
import type { AuthModel } from "../auth/model";
import { AuthService } from "../auth/service";
import { UserModel } from "./model";

export abstract class UserService {
  static async updateUserInfo(body: UserModel.UserUpdateBody, userId: number) {
    await db
      .update(userTable)
      .set({
        firstName: body.firstName,
        lastName: body.lastName,
      })
      .where(eq(userTable.id, userId));
  }

  static async updateUserAvatar(file: File, userId: number) {
    const fileId = await FileStorageService.uploadFile(file);

    const oldFileId = await db
      .select({ avatar: userTable.avatar })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .then((res) => res[0]?.avatar);

    await db
      .update(userTable)
      .set({
        avatar: fileId,
      })
      .where(eq(userTable.id, userId));

    if (oldFileId) {
      await FileStorageService.deleteFile(oldFileId);
    }

    return FileStorageService.getFileUrl(fileId);
  }

  // Creates a new user and assigns it to an admin (default role is operator)
  static async createAssignedUser(
    newUser: AuthModel.RegisterUserBody,
    assignedTo: number,
    role: UserModel.UserRole = UserModel.UserRoleEnum.operator
  ) {
    const res = await AuthService.registerUser(newUser, role, assignedTo);

    if (res === AppError.ResultEnum.Conflict) {
      return AppError.Conflict;
    }

    return {
      id: res.id,
      username: res.username,
      email: res.email,
      firstName: res.firstName,
      lastName: res.lastName,
    } as UserModel.UserInfo;
  }

  static async deleteAssignedUser(userId: number, assignedUserId: number) {
    try {
      await db.delete(userTable).where(
        inArray(
          userTable.id,
          db
            .select({ id: userTable.id })
            .from(userTable)
            .innerJoin(
              userAdminTable,
              and(
                eq(userAdminTable.userId, userTable.id),
                eq(userAdminTable.adminId, userId)
              )
            )
            .where(eq(userTable.id, assignedUserId))
        )
      );

      return;
    } catch {
      return AppError.Unauthorized;
    }
  }

  static async fetchAssignedUsers(
    assignedTo: number,
    role?: UserModel.UserRole
  ): Promise<UserModel.UserInfo[]> {
    const users = await db
      .select({
        id: userTable.id,
        username: userTable.username,
        email: userTable.email,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        avatar: userTable.avatar,
      })
      .from(userTable)
      .innerJoin(
        userAdminTable,
        and(
          not(eq(userTable.id, assignedTo)),
          eq(userTable.id, userAdminTable.userId),
          eq(userAdminTable.adminId, assignedTo)
        )
      )
      .where(role ? eq(userTable.role, role) : undefined);

    return users.map((el) => FileStorageService.resolveFile(el, "avatar"));
  }
}
