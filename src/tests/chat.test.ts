import { describe, expect, it } from "bun:test";
import { createDummyData, createSecondaryDummyData } from "../../scripts/dummy";
import type { ChatModel } from "../modules/chat/ChatModel";
import { ChatService } from "../modules/chat/ChatService";
import { api } from "./setup";
import { userHeader } from "./utils";

describe("Chat Tests", () => {
  describe("ChatService.createChat", () => {
    it("should create a chat with multiple users", async () => {
      const dummy = await createDummyData();
      const secondaryDummy = await createSecondaryDummyData();

      const chat = await ChatService.createChat("Test Chat", [
        dummy.admin.user.id,
        dummy.operator.user.id,
        secondaryDummy.admin.user.id,
      ]);

      expect(chat).toHaveProperty("id");
      expect(chat.name).toBe("Test Chat");
      expect(chat).toHaveProperty("createdAt");
      expect(chat).toHaveProperty("updatedAt");
    });

    it("should create a chat with single user", async () => {
      const dummy = await createDummyData();

      const chat = await ChatService.createChat("Solo Chat", [
        dummy.admin.user.id,
      ]);

      expect(chat).toHaveProperty("id");
      expect(chat.name).toBe("Solo Chat");
    });

    it("should create multiple chats with same users", async () => {
      const dummy = await createDummyData();

      const chat1 = await ChatService.createChat("Chat 1", [
        dummy.admin.user.id,
        dummy.operator.user.id,
      ]);

      const chat2 = await ChatService.createChat("Chat 2", [
        dummy.admin.user.id,
        dummy.operator.user.id,
      ]);

      expect(chat1.id).not.toBe(chat2.id);
      expect(chat1.name).toBe("Chat 1");
      expect(chat2.name).toBe("Chat 2");
    });
  });

  describe("ChatService.getUserChats", () => {
    it("should return all chats for a user", async () => {
      const dummy = await createDummyData();
      const secondaryDummy = await createSecondaryDummyData();

      await ChatService.createChat("Chat 1", [
        dummy.admin.user.id,
        dummy.operator.user.id,
      ]);

      await ChatService.createChat("Chat 2", [
        dummy.admin.user.id,
        secondaryDummy.admin.user.id,
      ]);

      const chats = await ChatService.getUserChats(dummy.admin.user.id);

      expect(chats).toBeArray();
      expect(chats.length).toBe(4);
      expect(chats[0]).toHaveProperty("id");
      expect(chats[0]).toHaveProperty("name");
      expect(chats[0]).toHaveProperty("lastMessage");
    });

    it("should return default private chats for newly created users", async () => {
      const dummy = await createDummyData();

      const chats = await ChatService.getUserChats(dummy.admin.user.id);

      expect(chats).toBeArray();
      expect(chats.length).toBe(2);
    });

    it("should not return chats user is not member of", async () => {
      const dummy = await createDummyData();
      const secondaryDummy = await createSecondaryDummyData();

      await ChatService.createChat("Private Chat", [
        secondaryDummy.admin.user.id,
        secondaryDummy.operator.user.id,
      ]);

      const chats = await ChatService.getUserChats(dummy.admin.user.id);

      expect(chats).toBeArray();
      expect(chats.length).toBe(2);
    });

    it("should include last message in chat", async () => {
      const dummy = await createDummyData();

      const chat = await ChatService.createChat("Chat with messages", [
        dummy.admin.user.id,
        dummy.operator.user.id,
      ]);

      await ChatService.sendMessage(
        chat.id,
        dummy.admin.user.id,
        "First message"
      );

      await ChatService.sendMessage(
        chat.id,
        dummy.operator.user.id,
        "Second message"
      );

      const chats = await ChatService.getUserChats(dummy.admin.user.id);

      expect(chats.length).toBe(3);
      const chatWithMessages = chats.find((c) => c.id === chat.id);
      expect(chatWithMessages).toBeDefined();
      expect(chatWithMessages?.lastMessage).not.toBeNull();
      expect(chatWithMessages?.lastMessage?.text).toBe("Second message");
      expect(chatWithMessages?.lastMessage?.userId).toBe(dummy.operator.user.id);
    });

    it("should return null lastMessage for chat without messages", async () => {
      const dummy = await createDummyData();

      const emptyChat = await ChatService.createChat("Empty Chat", [
        dummy.admin.user.id,
        dummy.operator.user.id,
      ]);

      const chats = await ChatService.getUserChats(dummy.admin.user.id);

      expect(chats.length).toBe(3);
      const chatWithoutMessages = chats.find((c) => c.id === emptyChat.id);
      expect(chatWithoutMessages?.lastMessage).toBeNull();
    });
  });

  describe("ChatService.sendMessage", () => {
    it("should send a message to a chat", async () => {
      const dummy = await createDummyData();

      const chat = await ChatService.createChat("Test Chat", [
        dummy.admin.user.id,
        dummy.operator.user.id,
      ]);

      const message = await ChatService.sendMessage(
        chat.id,
        dummy.admin.user.id,
        "Hello, World!"
      );

      expect(message).toHaveProperty("id");
      expect(message).toHaveProperty("chatId", chat.id);
      expect(message).toHaveProperty("userId", dummy.admin.user.id);
      expect(message).toHaveProperty("text", "Hello, World!");
      expect(message).toHaveProperty("createdAt");
      expect(message).toHaveProperty("files");
      expect((message as ChatModel.MessageWithFiles).files).toBeArray();
      expect((message as ChatModel.MessageWithFiles).files.length).toBe(0);
    });

    it("should send a message with file attachments", async () => {
      const dummy = await createDummyData();

      const file1 = new File(["content1"], "file1.txt", {
        type: "text/plain",
      });
      const file2 = new File(["content2"], "file2.txt", {
        type: "text/plain",
      });

      const chat = await ChatService.createChat("Test Chat", [
        dummy.admin.user.id,
      ]);

      const message = await ChatService.sendMessage(
        chat.id,
        dummy.admin.user.id,
        "Message with files",
        [file1, file2]
      );

      expect(message).toHaveProperty("id");
      expect((message as ChatModel.MessageWithFiles).files).toBeArray();
      expect((message as ChatModel.MessageWithFiles).files.length).toBe(2);
      expect((message as ChatModel.MessageWithFiles).files[0]).toHaveProperty(
        "id"
      );
      expect((message as ChatModel.MessageWithFiles).files[0]).toHaveProperty(
        "fileName"
      );
    });

    it("should not allow non-member to send message", async () => {
      const dummy = await createDummyData();
      const secondaryDummy = await createSecondaryDummyData();

      const chat = await ChatService.createChat("Private Chat", [
        dummy.admin.user.id,
        dummy.operator.user.id,
      ]);

      const message = await ChatService.sendMessage(
        chat.id,
        secondaryDummy.admin.user.id,
        "Unauthorized message"
      );

      expect(message).toHaveProperty("code", 401);
      expect(message).toHaveProperty("response", "Unauthorized");
    });

    it("should update chat updatedAt timestamp when message is sent", async () => {
      const dummy = await createDummyData();

      const chat = await ChatService.createChat("Test Chat", [
        dummy.admin.user.id,
      ]);

      const originalUpdatedAt = new Date(chat.updatedAt).getTime();

      await new Promise((resolve) => setTimeout(resolve, 10));

      await ChatService.sendMessage(
        chat.id,
        dummy.admin.user.id,
        "New message"
      );

      const chats = await ChatService.getUserChats(dummy.admin.user.id);
      const newUpdatedAt = new Date(chats[0].updatedAt).getTime();

      expect(newUpdatedAt).toBeGreaterThan(originalUpdatedAt);
    });

    it("should send multiple messages in same chat", async () => {
      const dummy = await createDummyData();

      const chat = await ChatService.createChat("Test Chat", [
        dummy.admin.user.id,
        dummy.operator.user.id,
      ]);

      const message1 = await ChatService.sendMessage(
        chat.id,
        dummy.admin.user.id,
        "Message 1"
      );

      const message2 = await ChatService.sendMessage(
        chat.id,
        dummy.operator.user.id,
        "Message 2"
      );

      const message3 = await ChatService.sendMessage(
        chat.id,
        dummy.admin.user.id,
        "Message 3"
      );

      expect((message1 as ChatModel.MessageWithFiles).text).toBe("Message 1");
      expect((message2 as ChatModel.MessageWithFiles).text).toBe("Message 2");
      expect((message3 as ChatModel.MessageWithFiles).text).toBe("Message 3");
    });
  });

  describe("Chat API Routes", () => {
    describe("GET /chat", () => {
      it("should return user's chats", async () => {
        const dummy = await createDummyData();

        await ChatService.createChat("Chat 1", [
          dummy.admin.user.id,
          dummy.operator.user.id,
        ]);

        await ChatService.createChat("Chat 2", [dummy.admin.user.id]);

        const res = await api.chat.get(userHeader(dummy.admin.token));

        expect(res.status).toBe(200);
        expect(res.data).toBeArray();
        expect((res.data as ChatModel.ChatWithLastMessage[]).length).toBe(4);
      });

      it("should return default private chats for newly created users", async () => {
        const dummy = await createDummyData();

        const res = await api.chat.get(userHeader(dummy.admin.token));

        expect(res.status).toBe(200);
        expect(res.data).toBeArray();
        expect((res.data as ChatModel.ChatWithLastMessage[]).length).toBe(2);
      });

      it("should require authentication", async () => {
        const res = await api.chat.get();

        expect(res.status).toBe(401);
      });

      it("should return chats with last message", async () => {
        const dummy = await createDummyData();

        const chat = await ChatService.createChat("Test Chat", [
          dummy.admin.user.id,
        ]);

        await ChatService.sendMessage(chat.id, dummy.admin.user.id, "Test");

        const res = await api.chat.get(userHeader(dummy.admin.token));

        expect(res.status).toBe(200);
        const chats = res.data as ChatModel.ChatWithLastMessage[];
        const testChat = chats.find((c) => c.id === chat.id);
        expect(testChat).toBeDefined();
        expect(testChat?.lastMessage).not.toBeNull();
        expect(testChat?.lastMessage?.text).toBe("Test");
      });
    });

    describe("POST /chat/:chatId/message", () => {
      it("should send a message to a chat", async () => {
        const dummy = await createDummyData();

        const chat = await ChatService.createChat("Test Chat", [
          dummy.admin.user.id,
        ]);

        const res = await api.chat({ chatId: chat.id }).message.post(
          {
            text: "Hello from API",
          },
          userHeader(dummy.admin.token)
        );

        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty("id");
        expect(res.data).toHaveProperty("text", "Hello from API");
        expect(res.data).toHaveProperty("chatId", chat.id);
        expect(res.data).toHaveProperty("userId", dummy.admin.user.id);
      });

      it("should send a message with file attachments", async () => {
        const dummy = await createDummyData();

        const file = new File(["content"], "file.txt", { type: "text/plain" });

        const chat = await ChatService.createChat("Test Chat", [
          dummy.admin.user.id,
        ]);

        const res = await api.chat({ chatId: chat.id }).message.post(
          {
            text: "Message with files",
            files: [file],
          },
          userHeader(dummy.admin.token)
        );

        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty("files");
        expect((res.data as ChatModel.MessageWithFiles).files).toBeArray();
        expect((res.data as ChatModel.MessageWithFiles).files.length).toBe(1);
      });

      it("should not allow non-member to send message", async () => {
        const dummy = await createDummyData();
        const secondaryDummy = await createSecondaryDummyData();

        const chat = await ChatService.createChat("Private Chat", [
          dummy.admin.user.id,
        ]);

        const res = await api.chat({ chatId: chat.id }).message.post(
          {
            text: "Unauthorized",
          },
          userHeader(secondaryDummy.admin.token)
        );

        expect(res.status).toBe(401);
      });

      it("should require authentication", async () => {
        const dummy = await createDummyData();

        const chat = await ChatService.createChat("Test Chat", [
          dummy.admin.user.id,
        ]);

        const res = await api.chat({ chatId: chat.id }).message.post({
          text: "No auth",
        });

        expect(res.status).toBe(401);
      });

      it("should allow all members to send messages", async () => {
        const dummy = await createDummyData();

        const chat = await ChatService.createChat("Test Chat", [
          dummy.admin.user.id,
          dummy.operator.user.id,
        ]);

        const res1 = await api.chat({ chatId: chat.id }).message.post(
          {
            text: "From admin",
          },
          userHeader(dummy.admin.token)
        );

        const res2 = await api.chat({ chatId: chat.id }).message.post(
          {
            text: "From operator",
          },
          userHeader(dummy.operator.token)
        );

        expect(res1.status).toBe(200);
        expect(res2.status).toBe(200);
        expect((res1.data as ChatModel.MessageWithFiles).userId).toBe(
          dummy.admin.user.id
        );
        expect((res2.data as ChatModel.MessageWithFiles).userId).toBe(
          dummy.operator.user.id
        );
      });

      it("should handle empty file array", async () => {
        const dummy = await createDummyData();

        const chat = await ChatService.createChat("Test Chat", [
          dummy.admin.user.id,
        ]);

        const res = await api.chat({ chatId: chat.id }).message.post(
          {
            text: "No files",
            files: [],
          },
          userHeader(dummy.admin.token)
        );

        expect(res.status).toBe(200);
        expect((res.data as ChatModel.MessageWithFiles).files.length).toBe(0);
      });
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete chat flow", async () => {
      const dummy = await createDummyData();
      const secondaryDummy = await createSecondaryDummyData();

      const chat = await ChatService.createChat("Project Discussion", [
        dummy.admin.user.id,
        dummy.operator.user.id,
        secondaryDummy.admin.user.id,
      ]);

      await ChatService.sendMessage(
        chat.id,
        dummy.admin.user.id,
        "Hello everyone!"
      );

      await ChatService.sendMessage(
        chat.id,
        dummy.operator.user.id,
        "Hi there!"
      );

      await ChatService.sendMessage(
        chat.id,
        secondaryDummy.admin.user.id,
        "Good to be here!"
      );

      const adminChats = await ChatService.getUserChats(dummy.admin.user.id);
      const operatorChats = await ChatService.getUserChats(
        dummy.operator.user.id
      );
      const secondaryAdminChats = await ChatService.getUserChats(
        secondaryDummy.admin.user.id
      );

      expect(adminChats.length).toBe(3);
      expect(operatorChats.length).toBe(2);
      expect(secondaryAdminChats.length).toBe(3);

      const sharedChat = adminChats.find((c) => c.id === chat.id);
      expect(sharedChat?.lastMessage?.text).toBe("Good to be here!");

      const operatorSharedChat = operatorChats.find((c) => c.id === chat.id);
      expect(operatorSharedChat?.lastMessage?.text).toBe("Good to be here!");

      const secondarySharedChat = secondaryAdminChats.find((c) => c.id === chat.id);
      expect(secondarySharedChat?.lastMessage?.text).toBe("Good to be here!");
    });

    it("should isolate chats between different users", async () => {
      const dummy = await createDummyData();
      const secondaryDummy = await createSecondaryDummyData();

      const chat1 = await ChatService.createChat("Team A", [
        dummy.admin.user.id,
        dummy.operator.user.id,
      ]);

      const chat2 = await ChatService.createChat("Team B", [
        secondaryDummy.admin.user.id,
        secondaryDummy.operator.user.id,
      ]);

      await ChatService.sendMessage(
        chat1.id,
        dummy.admin.user.id,
        "Team A message"
      );

      await ChatService.sendMessage(
        chat2.id,
        secondaryDummy.admin.user.id,
        "Team B message"
      );

      const adminChats = await ChatService.getUserChats(dummy.admin.user.id);
      const secondaryAdminChats = await ChatService.getUserChats(
        secondaryDummy.admin.user.id
      );

      expect(adminChats.length).toBe(3);
      const teamAChat = adminChats.find((c) => c.id === chat1.id);
      expect(teamAChat?.lastMessage?.text).toBe("Team A message");

      expect(secondaryAdminChats.length).toBe(3);
      const teamBChat = secondaryAdminChats.find((c) => c.id === chat2.id);
      expect(teamBChat?.lastMessage?.text).toBe("Team B message");
    });

    it("should handle user in multiple chats", async () => {
      const dummy = await createDummyData();
      const secondaryDummy = await createSecondaryDummyData();

      await ChatService.createChat("Chat 1", [
        dummy.admin.user.id,
        dummy.operator.user.id,
      ]);

      await ChatService.createChat("Chat 2", [
        dummy.admin.user.id,
        secondaryDummy.admin.user.id,
      ]);

      await ChatService.createChat("Chat 3", [
        dummy.admin.user.id,
        dummy.operator.user.id,
        secondaryDummy.admin.user.id,
      ]);

      const adminChats = await ChatService.getUserChats(dummy.admin.user.id);

      expect(adminChats.length).toBe(5);
    });
  });
});
