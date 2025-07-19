import { eq } from "drizzle-orm";
import { db } from "../../services/db/db";
import { userAdminTable, userTable } from "../../services/db/schema";
import { AppError } from "../../utils/error";
import { UserModel } from "../user/model";
import { jwtPlugin } from "./macro";
import type { AuthModel } from "./model";

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
		assignedTo?: number,
	) {
		registerBody.password = await Bun.password.hash(
			registerBody.password,
			"argon2d",
		);

		try {
			const user = (
				await db
					.insert(userTable)
					.values({ ...registerBody, role })
					.returning(UserWithoutPasswordSelect)
			)[0];

			await db
				.insert(userAdminTable)
				.values({ adminId: assignedTo ?? user.id, userId: user.id })
				.execute();

			return user;
		} catch {
			return AppError.ResultEnum.Conflict;
		}
	}

	static async registerUserAdmin(registerBody: AuthModel.RegisterUserBody) {
		const res = await AuthService.registerUser(
			registerBody,
			UserModel.UserRoleEnum.admin,
		);
		if (res === AppError.ResultEnum.Conflict) {
			return AppError.Conflict;
		}
		return await signUserWithoutPassword(res);
	}

	static async loginUser(loginBody: AuthModel.LoginUserBody) {
		const user = (
			await db
				.select({ ...UserWithoutPasswordSelect, password: userTable.password })
				.from(userTable)
				.where(eq(userTable.email, loginBody.email))
		).pop();

		if (!user) return AppError.NotFound;

		if (
			!(await Bun.password.verify(loginBody.password, user.password, "argon2d"))
		)
			return AppError.Unauthorized;
		return await signUserWithoutPassword(user);
	}
}
