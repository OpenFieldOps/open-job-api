import { t } from "elysia";
import { UserModel } from "../user/model";

export namespace AuthModel {
  export const RegisterUserBody = t.Object({
    email: t.String(),
    firstName: t.String(),
    lastName: t.String(),
    username: t.String(),
    password: t.String(),
  });
  export type RegisterUserBody = typeof RegisterUserBody.static;

  export const LoginUserBody = t.Object({
    email: t.String(),
    password: t.String(),
  });
  export type LoginUserBody = typeof LoginUserBody.static;

  export const AuthenticatedUserSuccessResponse = t.Object({
    user: UserModel.UserWithoutPassword,
    token: t.String(),
  });
  export type AuthenticatedUserSuccessResponse =
    typeof AuthenticatedUserSuccessResponse.static;
}
