import type { RedisClient } from "bun";
import Elysia, { t } from "elysia";
import { redisChatKey, redisClient } from "../../services/redis";
import { authMacroPlugin, userFromAuthorizationToken } from "../auth/macro";
import { ChatModel } from "./ChatModel";
import { ChatService } from "./ChatService";

const connectionPool = new Map<string, RedisClient>();

export const chatPlugin = new Elysia({
  name: "chat",
  prefix: "/chat",
  tags: ["chat"],
  detail: {
    summary: "Chat Module",
    description:
      "Handles chat-related operations such as listing chats and sending messages.",
  },
  aot: true,
})
  .use(authMacroPlugin)
  .get("/", async ({ user }) => ChatService.getUserChats(user.id), {
    user: true,
    detail: {
      summary: "Get User Chats",
      description: "Get all chats for the current user with last message",
    },
  })
  .get(
    "/:chatId/messages",
    async ({ params: { chatId }, query, user }) => {
      return ChatService.getMessages(chatId, user.id, query.page, query.limit);
    },
    {
      params: t.Object({
        chatId: t.Number(),
      }),
      query: t.Object({
        page: t.Numeric({ default: 1, minimum: 1 }),
        limit: t.Numeric({ default: 50, minimum: 1, maximum: 100 }),
      }),
      user: true,
      detail: {
        summary: "Get Chat Messages",
        description: "Get messages from a chat with pagination",
      },
    }
  )
  .ws("/new-message", {
    query: t.Object({
      token: t.String(),
      chatId: t.Number(),
    }),
    async open(ws) {
      const { token, chatId } = ws.data.query;

      const user = await userFromAuthorizationToken(token);

      if (!user) {
        ws.close();
        return;
      }

      const client = await redisClient.duplicate();
      client.connect();
      client.subscribe(redisChatKey(chatId), (message) => {
        ws.send(message);
      });

      connectionPool.set(ws.id, client);
    },
    async close(ws) {
      const client = connectionPool.get(ws.id);
      if (client) {
        await client.unsubscribe();
        client.close();
        connectionPool.delete(ws.id);
      }
    },
  })
  .post(
    "/:chatId/message",
    async ({ params: { chatId }, body, user }) => {
      return ChatService.sendMessage(chatId, user.id, body.text, body.files);
    },
    {
      params: t.Object({
        chatId: t.Number(),
      }),
      body: ChatModel.SendMessageBody,
      user: true,
      detail: {
        summary: "Send Message",
        description: "Send a message in a chat with optional file attachments",
      },
    }
  );
