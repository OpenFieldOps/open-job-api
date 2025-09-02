import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { config } from "./config";
import { jobPlugin } from "./modules/job/index";
import { userPlugin } from "./modules/user";
import "./services/db/db";
import { cors } from "@elysiajs/cors";
import { authPlugin } from "./modules/auth";
import { filePlugin } from "./modules/files";
import { userNotificationPlugin } from "./modules/notification";

export const app = new Elysia({
  name: "App",
  prefix: "/api",
})
  .use(cors())
  .use(
    Bun.env.NODE_ENV === "development"
      ? swagger({
          documentation: {
            info: {
              description: "API documentation for the service app",
              title: "Service API",
              version: "1.0.0",
            },
          },
        })
      : new Elysia()
  )
  .onError((error) => {
    if (error.error instanceof Error) {
      console.error("Error:", error.error);
    }
  })
  .use(authPlugin)
  .use(userPlugin)
  .use(userNotificationPlugin)
  .use(jobPlugin)
  .use(filePlugin);

await new Promise<void>((resolve) => {
  app.listen(
    {
      port: config.server.backend_port,
      hostname: "0.0.0.0",
    },
    () => {
      if (Bun.env.NODE_ENV !== "test") {
        console.log(
          `Server is running on http://localhost:${config.server.backend_port}`
        );
      }
      resolve();
    }
  );
});

export type App = typeof app;
