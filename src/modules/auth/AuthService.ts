import { eq } from "drizzle-orm";
import WelcomeEmail from "../../emails/WelcomeEmail";
import { db } from "../../services/db/db";
import {
  userAdminTable,
  userLocationTable,
  userTable,
} from "../../services/db/schema";
import { sendEmail } from "../../services/mail/resend";
import { FileStorageService } from "../../services/storage/s3";
import { AppError } from "../../utils/error";
import { UserModel } from "../user/UserModel";
import type { AuthModel } from "./AuthModel";
import { jwtPlugin } from "./macro";

async function signUserWithoutPassword(user: UserModel.UserWithoutPassword) {
  const formatedUser = {
    ...user,
    avatar: user.avatar ? user.avatar : "",
  };
  return {
    user: formatedUser,
    token: await jwtPlugin.decorator.jwt.sign(formatedUser),
  };
}

export abstract class AuthService {
  // default user is register as admin
  // If assignedTo is provided, the user is registered as a user under the admin with the given assignedTo ID.
  static async registerUser(
    registerBody: AuthModel.RegisterUserBody,
    role: UserModel.UserRole,
    assignedTo?: number
  ) {
    const body = {
      ...registerBody,
    };
    body.password = await Bun.password.hash(body.password, "argon2d");

    try {
      const user = (
        await db
          .insert(userTable)
          .values({ ...body, role })
          .returning(UserModel.userWithoutPasswordSelect)
      )[0];

      await db
        .insert(userAdminTable)
        .values({ adminId: assignedTo ?? user.id, userId: user.id })
        .execute();

      await db
        .insert(userLocationTable)
        .values({ userId: user.id, latitude: 0, longitude: 0 })
        .execute();

      return user;
    } catch {
      return AppError.ResultEnum.Conflict;
    }
  }

  static async registerUserAdmin(registerBody: AuthModel.RegisterUserBody) {
    const res = await AuthService.registerUser(
      registerBody,
      UserModel.UserRoleEnum.admin
    );
    if (res === AppError.ResultEnum.Conflict) {
      return AppError.Conflict;
    }
    const auth = await signUserWithoutPassword(res);
    auth.user = FileStorageService.resolveFile(auth.user, "avatar");

    await sendEmail(
      WelcomeEmail({
        firstName: registerBody.firstName,
        lastName: registerBody.lastName,
      }),
      registerBody.email,
      "Welcome to Planned Service"
    );

    return auth;
  }

  static async loginUser(loginBody: AuthModel.LoginUserBody) {
    const user = (
      await db
        .select({
          ...UserModel.userWithoutPasswordSelect,
          password: userTable.password,
        })
        .from(userTable)
        .where(eq(userTable.email, loginBody.email))
    ).pop();

    if (!user) return AppError.NotFound;
    if (
      !(await Bun.password.verify(loginBody.password, user.password, "argon2d"))
    )
      return AppError.Unauthorized;

    const auth = await signUserWithoutPassword(user);
    auth.user = FileStorageService.resolveFile(auth.user, "avatar");
    return auth;
  }

  static async getAuthenticatedUser(userId: number) {
    const user = (
      await db
        .update(userTable)
        .set({ lastSeen: new Date().toISOString() })
        .where(eq(userTable.id, userId))
        .returning(UserModel.userWithoutPasswordSelect)
    ).pop();

    if (!user) return AppError.NotFound;

    return FileStorageService.resolveFile(user, "avatar");
  }
}
