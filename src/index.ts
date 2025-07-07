import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { validAppEnv } from "./env";
import { authPlugin } from "./modules/auth";
import { AuthModel } from "./modules/auth/model";
import { interventionPlugin } from "./modules/intervention/index";
import { userPlugin } from "./modules/user";
import { UserModel } from "./modules/user/model";
import "./services/db/db";

validAppEnv();

const app = new Elysia({
  name: "App",
})
  .use(
    swagger({
      documentation: {
        info: {
          title: "Service API",
          version: "1.0.0",
          description: "API documentation for the service app",
        },
      },
    })
  )
  .use(cors())
  .onError(({ error }) => console.error(error))
  .use(authPlugin)
  .use(userPlugin)
  .use(interventionPlugin);

app.listen(Bun.env.APP_PORT as string, () => {
  console.log("App running on port:", Bun.env.APP_PORT);
});

export type App = typeof app;

export namespace BackendModel {
  export const Auth = AuthModel;
  export const User = UserModel;
}
