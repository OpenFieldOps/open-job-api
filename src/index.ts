import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { authPlugin } from "./modules/auth";
import { AuthModel } from "./modules/auth/model";
import { jobPlugin } from "./modules/job/index";
import { userPlugin } from "./modules/user";
import { UserModel } from "./modules/user/model";
import { startFrontendServing } from "./frontend";
import { config } from "./config";
import "./services/db/db";

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

app.listen(config.server.backend_port, () => {
  if (Bun.env.NODE_ENV !== "test") {
    console.log(
      `Server is running on http://localhost:${config.server.backend_port}`
    );
  }
});

Bun.file("./public")
  .stat()
  .then((info) => {
    if (info.isDirectory()) {
      startFrontendServing();
    }
  })
  .catch(() => {
    console.warn("Public directory not found, frontend serving skipped.");
  });

export type App = typeof app;

export namespace BackendModel {
  export const Auth = AuthModel;
  export const User = UserModel;
}
