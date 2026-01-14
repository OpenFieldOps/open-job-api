import Elysia from "elysia";
import { authMacroPlugin } from "./macro";
import { AuthModel } from "./AuthModel";
import { AuthService } from "./AuthService";

export const authPlugin = new Elysia({
  prefix: "/auth",
  name: "auth",
  tags: ["auth"],
  detail: {
    summary: "Authentication Module",
    description: "Handles user authentication, registration, and login",
  },
  aot: true,
})
  .use(authMacroPlugin)
  .post(
    "/register",
    async ({ body }) => await AuthService.registerUserAdmin(body),
    {
      body: AuthModel.RegisterUserBody,
      detail: {
        summary: "Register User",
        description: "Register a new user",
      },
    }
  )
  .post("/login", async ({ body }) => await AuthService.loginUser(body), {
    body: AuthModel.LoginUserBody,
    detail: {
      summary: "Login User",
      description: "Login an existing user",
    },
  })
  .get(
    "/me",
    async ({ user }) => await AuthService.getAuthenticatedUser(user.id),
    {
      user: true,
      detail: {
        summary: "Get Authenticated User",
        description: "Fetch the currently authenticated user",
      },
    }
  );
