import { Elysia } from "elysia";
import { config } from "./config";
import { jobPlugin } from "./modules/job/JobPlugin";
import { userPlugin } from "./modules/user/UserPlugin";
import "./services/db/db";
import { cors } from "@elysiajs/cors";
import { authPlugin } from "./modules/auth/AuthPlugin";
import { filePlugin } from "./modules/files/FilesPlugin";
import { InvoicePlugin } from "./modules/invoice/InvoicePlugin";
import { userNotificationPlugin } from "./modules/notification/NotificationPlugin";
import { pricingModelPlugin } from "./modules/pricing-model/PricingModelPlugin";
import openapi from "@elysiajs/openapi";

export const app = new Elysia({
  name: "App",
  prefix: "/api",
})
  .use(cors())
  .use(
    openapi({
      enabled: Bun.env.NODE_ENV !== "production",
    })
  )
  .onError((error) => {
    console.error(error);
  })
  .use(authPlugin)
  .use(userPlugin)
  .use(userNotificationPlugin)
  .use(jobPlugin)
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
