import { and, eq, exists, not } from "drizzle-orm";
import { db } from "../../services/db/db";
import {
  userAdminTable,
  userLocationTable,
  userTable,
} from "../../services/db/schema";
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
        phone: body.phone,
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

  // (default role is operator)
  static async createAssignedUser(
    newUser: AuthModel.RegisterUserBody,
    assignedTo: number,
    role: UserModel.UserRole
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
      lastSeen: res.lastSeen,
      avatar: res.avatar,
      role: res.role,
      phone: res.phone,
      pricingModel: null,
    } as UserModel.UserInfo;
  }

  static async deleteAssignedUser(userId: number, assignedUserId: number) {
    const isAssignedUser = await db
      .select({ id: userAdminTable.userId })
      .from(userAdminTable)
      .where(
        and(
          eq(userAdminTable.adminId, userId),
          eq(userAdminTable.userId, assignedUserId)
        )
      )
      .then((res) => res.length > 0);

    if (!isAssignedUser) {
      return AppError.Unauthorized;
    }

    try {
      await db.delete(userTable).where(eq(userTable.id, assignedUserId));

      return;
    } catch {
      return AppError.InternalServerError;
    }
  }

  static async fetchAssignedUsers(
    assignedTo: number,
    role?: UserModel.UserRole
  ): Promise<UserModel.UserInfo[]> {
    const users = await db
      .select(UserModel.userWithoutPasswordSelect)
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

  static async fetchAssignedUserLocation(
    userId: number,
    assignedUserId: number
  ) {
    const sub = db
      .select({ id: userAdminTable.userId })
      .from(userAdminTable)
      .where(
        and(
          eq(userAdminTable.userId, userLocationTable.userId),
          eq(userAdminTable.adminId, userId)
        )
      );

    const userLocation = (
      await db
        .select({
          latitude: userLocationTable.latitude,
          longitude: userLocationTable.longitude,
          updatedAt: userLocationTable.updatedAt,
        })
        .from(userLocationTable)
        .where(and(eq(userLocationTable.userId, assignedUserId), exists(sub)))
        .limit(1)
    ).pop();

    if (!userLocation) {
      return AppError.NotFound;
    }

    return {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      updatedAt: userLocation.updatedAt,
    };
  }

  static async updateUserLocation(
    userId: number,
    latitude: number,
    longitude: number
  ) {
    const updatedAt = new Date().toISOString();

    await db
      .update(userLocationTable)
      .set({
        latitude,
        longitude,
        updatedAt,
      })
      .where(eq(userLocationTable.userId, userId));
  }
}
