import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { validAppEnv } from "./env";
import { authPlugin } from "./modules/auth";
import { AuthModel } from "./modules/auth/model";
import { jobPlugin } from "./modules/job/index";
import { userPlugin } from "./modules/user";
import { UserModel } from "./modules/user/model";
import "./services/db/db";
import { startFrontendServing } from "./frontend";

validAppEnv();

export const app = new Elysia({
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
  .use(authPlugin)
  .use(userPlugin)
  .use(jobPlugin);

app.listen(Bun.env.APP_PORT, () => {
  if (Bun.env.NODE_ENV !== "test") {
    console.log(`Server is running on http://localhost:${Bun.env.APP_PORT}`);
  }
});

Bun.file("./public")
  .stat()
  .then((info) => {
    if (info.isDirectory()) {
      startFrontendServing();
    }
  })
  .catch(() => {});

export type App = typeof app;

export namespace BackendModel {
  export const Auth = AuthModel;
  export const User = UserModel;
}
