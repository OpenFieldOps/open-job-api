import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { config } from "./config";
import { startFrontendServing } from "./frontend";
import { authPlugin } from "./modules/auth";
import { AuthModel } from "./modules/auth/model";
import { jobPlugin } from "./modules/job/index";
import { userPlugin } from "./modules/user";
import { UserModel } from "./modules/user/model";
import "./services/db/db";
import { filePlugin } from "./modules/files";

export const app = new Elysia({
	name: "App",
})
	.use(
		swagger({
			documentation: {
				info: {
					description: "API documentation for the service app",
					title: "Service API",
					version: "1.0.0",
				},
			},
		}),
	)
	.use(cors())
	.onError((error) => {
		if (Bun.env.NODE_ENV !== "test") {
			console.error("An error occurred:", error);
		}
	})
	.use(authPlugin)
	.use(userPlugin)
	.use(jobPlugin)
	.use(filePlugin);

app.listen(config.server.backend_port, () => {
	if (Bun.env.NODE_ENV !== "test") {
		console.log(
			`Server is running on http://localhost:${config.server.backend_port}`,
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
