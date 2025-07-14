import cors from "@elysiajs/cors";
import staticPlugin from "@elysiajs/static";
import Elysia from "elysia";
import { config } from "./config";

export function startFrontendServing() {
	new Elysia()
		.use(cors())
		.use(
			staticPlugin({
				assets: "./public/",
				indexHTML: true,
				prefix: "/",
			}),
		)
		.listen(config.server.frontend_port, () => {
			console.log(
				`Frontend is serving on http://localhost${config.server.frontend_port}`,
			);
		});
}
