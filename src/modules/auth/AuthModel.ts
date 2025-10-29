import { t } from "elysia";
import { UserModel } from "../user/UserModel";

export namespace AuthModel {
	export const RegisterUserBody = t.Object({
		email: t.String({
			format: "email",
		}),
		firstName: t.String({
			minLength: 3,
		}),
		lastName: t.String({
			minLength: 3,
		}),
		username: t.String({
			minLength: 3,
			maxLength: 20,
			pattern: "^[a-zA-Z0-9_]+$",
		}),
		password: t.String({
			minLength: 6,
		}),
		phone: t.Optional(t.String()),
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
