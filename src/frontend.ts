import cors from "@elysiajs/cors";
import staticPlugin from "@elysiajs/static";
import Elysia from "elysia";

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
    .listen(8080, () => {
      console.log("Frontend is serving on http://localhost:8080");
    });
}
