import cors from "@elysiajs/cors";
import staticPlugin from "@elysiajs/static";
import Elysia from "elysia";
import { config } from "./config";

export function startFrontendServing() {
  new Elysia()
    .use(cors())
    .use(
      staticPlugin({
        indexHTML: true,
        assets: "./public/",
        prefix: "/",
      })
    )
    .listen(config.server.frontend_port, () => {
      console.log(
        "Frontend is serving on http://localhost" + config.server.frontend_port
      );
    });
}
