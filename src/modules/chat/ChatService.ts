import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../services/db/db";
import {
  chatMembersTable,
  chatTable,
  fileTable,
  messageFilesTable,
  messageTable,
} from "../../services/db/schema";
import { redisChatKey, redisClient } from "../../services/redis";
import { FileStorageService } from "../../services/storage/s3";
import { AppError } from "../../utils/error";
import type { ChatModel } from "./ChatModel";

export abstract class ChatService {
  static async createChat(name: string, userIds: number[]) {
    const [chat] = await db
      .insert(chatTable)
      .values({
        name,
      })
      .returning();

    const chatMembers = userIds.map((userId) => ({
      chatId: chat.id,
      userId,
    }));

    await db.insert(chatMembersTable).values(chatMembers);

    return chat;
  }

  static async setMembers(chatId: number, userIds: number[]) {
    const chatMembers = userIds.map((userId) => ({
      chatId,
      userId,
    }));

    await db.transaction(async (tx) => {
      await tx
        .delete(chatMembersTable)
        .where(eq(chatMembersTable.chatId, chatId));

      if (chatMembers.length > 0) {
        await tx.insert(chatMembersTable).values(chatMembers);
      }
    });
  }

  static async getUserChats(
    userId: number
  ): Promise<ChatModel.ChatWithLastMessage[]> {
    const chats = await db
      .select({
        id: chatTable.id,
        name: chatTable.name,
        createdAt: chatTable.createdAt,
        updatedAt: chatTable.updatedAt,
      })
      .from(chatTable)
      .innerJoin(
        chatMembersTable,
        and(
          eq(chatTable.id, chatMembersTable.chatId),
          eq(chatMembersTable.userId, userId)
        )
      );

    const chatsWithLastMessage = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = await db
          .select({
            text: messageTable.text,
            createdAt: messageTable.createdAt,
            userId: messageTable.userId,
          })
          .from(messageTable)
          .where(eq(messageTable.chatId, chat.id))
          .orderBy(desc(messageTable.createdAt), desc(messageTable.id))
          .limit(1)
          .then((res) => res[0] || null);

        return {
          ...chat,
          lastMessage,
        };
      })
    );

    return chatsWithLastMessage;
  }

  static async sendMessage(
    chatId: number,
    userId: number,
    text: string,
    uploadedFiles?: File[]
  ): Promise<ChatModel.MessageWithFiles | typeof AppError.Unauthorized> {
    const isMember = await db
      .select({ id: chatMembersTable.id })
      .from(chatMembersTable)
      .where(
        and(
          eq(chatMembersTable.chatId, chatId),
          eq(chatMembersTable.userId, userId)
        )
      )
      .then((res) => res.length > 0);

    if (!isMember) {
      return AppError.Unauthorized;
    }

    const [message] = await db
      .insert(messageTable)
      .values({
        chatId,
        userId,
        text,
      })
      .returning();

    let files: { id: string; fileName: string }[] = [];

    if (uploadedFiles && uploadedFiles.length > 0) {
      const fileIds = await Promise.all(
        uploadedFiles.map((file) => FileStorageService.uploadFile(file))
      );

      const messageFilesData = fileIds.map((fileId) => ({
        messageId: message.id,
        fileId,
      }));

      await db.insert(messageFilesTable).values(messageFilesData);

      files = await db
        .select({
          id: fileTable.id,
          fileName: fileTable.fileName,
        })
        .from(fileTable)
        .where(inArray(fileTable.id, fileIds));

      files = files.map((file) => ({
        ...file,
        fileName: FileStorageService.getFileUrl(file.id),
      }));
    }

    await db
      .update(chatTable)
      .set({
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(chatTable.id, chatId));

    await redisClient.publish(
      redisChatKey(chatId),
      JSON.stringify({
        chatId,
        createdAt: message.createdAt,
        id: message.id,
        text: message.text,
        userId: message.userId,
        files,
      } as ChatModel.MessageWithFiles)
    );

    return {
      id: message.id,
      chatId: message.chatId,
      userId: message.userId,
      text: message.text,
      createdAt: message.createdAt,
      files,
    };
  }

  static async getMessages(
    chatId: number,
    userId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<
    | {
        messages: ChatModel.MessageWithFiles[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }
    | typeof AppError.Unauthorized
  > {
    const isMember = await db
      .select({ id: chatMembersTable.id })
      .from(chatMembersTable)
      .where(
        and(
          eq(chatMembersTable.chatId, chatId),
          eq(chatMembersTable.userId, userId)
        )
      )
      .then((res) => res.length > 0);

    if (!isMember) {
      return AppError.Unauthorized;
    }

    const offset = (page - 1) * limit;

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messageTable)
      .where(eq(messageTable.chatId, chatId));

    const total = Number(totalResult.count);

    const messages = await db
      .select({
        id: messageTable.id,
        chatId: messageTable.chatId,
        userId: messageTable.userId,
        text: messageTable.text,
        createdAt: messageTable.createdAt,
      })
      .from(messageTable)
      .where(eq(messageTable.chatId, chatId))
      .orderBy(desc(messageTable.createdAt), desc(messageTable.id))
      .limit(limit)
      .offset(offset);

    const messagesWithFiles = await Promise.all(
      messages.map(async (message) => {
        const messageFiles = await db
          .select({
            id: fileTable.id,
            fileName: fileTable.fileName,
          })
          .from(messageFilesTable)
          .innerJoin(fileTable, eq(messageFilesTable.fileId, fileTable.id))
          .where(eq(messageFilesTable.messageId, message.id));

        const files = messageFiles.map((file) => ({
          id: file.id,
          fileName: FileStorageService.getFileUrl(file.id),
        }));

        return {
          ...message,
          files,
        };
      })
    );

    return {
      messages: messagesWithFiles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
