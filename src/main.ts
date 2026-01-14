import { Elysia } from "elysia";
import { config } from "./config";
import { jobPlugin } from "./modules/job/JobPlugin";
import { userPlugin } from "./modules/user/UserPlugin";
import "./services/db/db";
import { cors } from "@elysiajs/cors";
import openapi from "@elysiajs/openapi";
import { authPlugin } from "./modules/auth/AuthPlugin";
import { chatPlugin } from "./modules/chat/ChatPlugin";
import { filePlugin } from "./modules/files/FilesPlugin";
import { InvoicePlugin } from "./modules/invoice/InvoicePlugin";
import { userNotificationPlugin } from "./modules/notification/NotificationPlugin";
import { pricingModelPlugin } from "./modules/pricing-model/PricingModelPlugin";

export const app = new Elysia({
  name: "App",
  prefix: "/api",
  aot: true,
  precompile: true,
  normalize: false,
})
  .use(cors())
  .use(
    openapi({
      enabled: Bun.env.NODE_ENV !== "production",
    })
  )
  .onError((err) => {
    console.error(err);
    return { message: "Internal Server Error" };
  })
  .use(authPlugin)
  .use(userPlugin)
  .use(userNotificationPlugin)
  .use(jobPlugin)
  .use(chatPlugin)
  .use(filePlugin)
  .use(pricingModelPlugin)
  .use(InvoicePlugin)
  .get("/health", "ok");

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
