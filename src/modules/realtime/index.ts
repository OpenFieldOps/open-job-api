import Elysia from "elysia";
import type { ElysiaWS } from "elysia/dist/ws";

import { redisSubscriber } from "../../services/redis/client";
import type { RealtimeModel } from "../../services/redis/model";
import { userFromAuthorizationHeader } from "../auth/macro";

export const userSockets = new Map<number, ElysiaWS>();

const extractToken = (url: string): string | undefined => {
	return url.split("authorization=").pop()?.trim();
};

export const realtimePlugin = new Elysia({
	name: "realtime",
	prefix: "/realtime",
	tags: ["realtime"],
}).ws("/", {
	async open(ws) {
		const user = await userFromAuthorizationHeader(
			extractToken(ws.data.request.url),
		);

		if (!user) {
			ws.close(1008, "Unauthorized");
			return;
		}

		userSockets.set(user.id, ws);
	},

	async close(ws) {
		const user = await userFromAuthorizationHeader(
			extractToken(ws.data.request.url),
		);

		if (user) {
			userSockets.delete(user.id);
		}
	},
});

redisSubscriber.subscribe("user");
redisSubscriber.on("message", (_, message) => {
	try {
		const { userId, data, type } = JSON.parse(
			message,
		) as RealtimeModel.UserRealtimeMessage;
		const ws = userSockets.get(userId);

		if (ws) {
			ws.send(JSON.stringify({ type, data }));
		}
	} catch (err) {
		console.error("Failed to parse Redis message:", err);
	}
});
