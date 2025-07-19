import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { config } from "../../config";
import { AppError } from "../../utils/error";
import type { UserModel } from "../user/model";

export const jwtPlugin = jwt({
	name: "jwt",
	secret: config.server.jwt_secret,
});

async function userFromAuthorizationHeader(
	authorization: string | undefined,
): Promise<UserModel.UserWithoutPassword | undefined> {
	if (!authorization) return undefined;

	const payload = await jwtPlugin.decorator.jwt.verify(authorization);

	if (!payload) return undefined;

	return payload as UserModel.UserWithoutPassword;
}

export const authMacroPlugin = new Elysia({
	name: "authMacro",
	tags: ["auth"],
}).macro({
	user: () => ({
		resolve: async ({ headers }) => {
			const payload = await userFromAuthorizationHeader(headers.authorization);

			if (!payload) {
				return AppError.Unauthorized;
			}

			return {
				user: payload as UserModel.UserWithoutPassword,
			};
		},
	}),
});

export const roleMacroPlugin = new Elysia({
	name: "roleMacro",
	tags: ["role"],
}).macro({
	role: (role: UserModel.UserRole) => ({
		resolve: async ({ headers }) => {
			const payload = await userFromAuthorizationHeader(headers.authorization);

			if (!payload || payload.role !== role) {
				return AppError.Unauthorized;
			}

			return {
				user: payload as UserModel.UserWithoutPassword,
			};
		},
	}),
});
