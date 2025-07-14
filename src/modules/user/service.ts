import { and, eq, not } from "drizzle-orm";
import { db } from "../../services/db/db";
import { userAdminTable, userTable } from "../../services/db/schema";
import { uploadFile } from "../../services/storage/s3";
import { UserModel } from "./model";
import type { AuthModel } from "../auth/model";
import { AuthService } from "../auth/service";
import { AppError } from "../../utils/error";

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
    const fileId = await uploadFile(file);
    await db
      .update(userTable)
      .set({
        avatar: fileId,
      })
      .where(eq(userTable.id, userId));
  }

  static async createAssignedUser(
    newUser: AuthModel.RegisterUserBody,
    assignedTo: number
  ) {
    const res = await AuthService.registerUser(
      newUser,
      UserModel.UserRoleEnum.user,
      assignedTo
    );

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

  static async fetchAssignedUsers(
    assignedTo: number
  ): Promise<UserModel.UserInfo[]> {
    const users = await db
      .select({
        id: userTable.id,
        username: userTable.username,
        email: userTable.email,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
      })
      .from(userTable)
      .innerJoin(
        userAdminTable,
        and(
          not(eq(userTable.id, assignedTo)),
          eq(userTable.id, userAdminTable.userId),
          eq(userAdminTable.adminId, assignedTo)
        )
      );

    return users;
  }
}
