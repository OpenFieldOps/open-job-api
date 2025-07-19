import Elysia, { t } from "elysia";
import { authMacroPlugin } from "./macro";
import { AuthModel } from "./model";
import { AuthService } from "./service";

export const authPlugin = new Elysia({
	prefix: "/auth",
	name: "auth",
	tags: ["auth"],
	detail: {
		summary: "Authentication Module",
		description: "Handles user authentication, registration, and login",
	},
})
	.use(authMacroPlugin)
	.post(
		"/register",
		async ({ body }) => await AuthService.registerUserAdmin(body),
		{
			body: AuthModel.RegisterUserBody,
			response: {
				409: t.String(),
				500: t.String(),
				200: AuthModel.AuthenticatedUserSuccessResponse,
			},
			detail: {
				summary: "Register User",
				description: "Register a new user",
			},
		},
	)
	.post("/login", async ({ body }) => await AuthService.loginUser(body), {
		body: AuthModel.LoginUserBody,
		response: {
			401: t.String(),
			404: t.String(),
			200: AuthModel.AuthenticatedUserSuccessResponse,
		},
		detail: {
			summary: "Login User",
			description: "Login an existing user",
		},
	});
