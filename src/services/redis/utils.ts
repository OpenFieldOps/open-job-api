import { userSockets } from "../../modules/realtime";
import { redisPublisher } from "./client";
import type { RealtimeModel } from "./model";

export function sendUserMessage(
	userId: number,
	type: RealtimeModel.RealtimeMessageType,
	data: unknown,
): void {
	const ws = userSockets.get(userId);
	if (ws) {
		ws.send(JSON.stringify({ type, data }));
		return;
	}
	redisPublisher.publish(
		"user",
		JSON.stringify({
			userId,
			type,
			data,
		}),
	);
}
