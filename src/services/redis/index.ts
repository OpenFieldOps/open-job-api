import { RedisClient } from "bun";

export const redisClient = new RedisClient();

await redisClient.connect();

enum RedisKeys {
  CHAT_MESSAGE = "chat-message",
}

export function redisChatKey(chatId: number) {
  return `${RedisKeys.CHAT_MESSAGE}:${chatId}`;
}
