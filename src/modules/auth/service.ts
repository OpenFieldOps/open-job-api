import { eq } from "drizzle-orm";
import { db } from "../../services/db/db";
import { userTable } from "../../services/db/schema";
import { AppError } from "../../utils/error";
import { UserModel } from "../user/model";
import { jwtPlugin } from "./macro";
import { AuthModel } from "./model";

const UserWithoutPasswordSelect = {
  id: userTable.id,
  username: userTable.username,
  email: userTable.email,
  firstName: userTable.firstName,
  lastName: userTable.lastName,
  avatar: userTable.avatar,
  role: userTable.role,
};

async function signUserWithoutPassword(user: UserModel.UserWithoutPassword) {
  return {
    user,
    token: await jwtPlugin.decorator.jwt.sign(user),
  };
}

export abstract class AuthService {
  static async registerUser(registerBody: AuthModel.RegisterUserBody) {
    registerBody.password = await Bun.password.hash(
      registerBody.password,
      "argon2d"
    );

    try {
      const user = (
        await db
          .insert(userTable)
          .values(registerBody)
          .returning(UserWithoutPasswordSelect)
      )[0];

      return await signUserWithoutPassword(user);
    } catch {
      return AppError.Conflict;
    }
  }

  static async loginUser(loginBody: AuthModel.LoginUserBody) {
    const user = (
      await db
        .select({ ...UserWithoutPasswordSelect, password: userTable.password })
        .from(userTable)
        .where(eq(userTable.email, loginBody.email))
    ).pop();

    if (!user) return AppError.NotFound;

    if (!(await Bun.password.verify(loginBody.password, user.password)))
      return AppError.Unauthorized;
    return await signUserWithoutPassword(user);
  }
}
