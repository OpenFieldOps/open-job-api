import { relations } from "drizzle-orm";
import { pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import DbUtils from "../../utils";
import { fileTable } from "./files";
import { userTable } from "./users";

const { defaultId, defaultDate, defaultVarChar, tableIdRef } = DbUtils;

export const chatTable = pgTable("chats", {
  id: defaultId(),
  name: defaultVarChar(),
  createdAt: defaultDate(),
  updatedAt: defaultDate().$onUpdate(() => new Date().toISOString()),
});

export const chatMembersTable = pgTable(
  "chat_members",
  {
    id: defaultId(),
    chatId: tableIdRef(chatTable.id),
    userId: tableIdRef(userTable.id),
    joinedAt: defaultDate(),
  },
  (table) => ({
    uniqueChatUser: unique().on(table.chatId, table.userId),
  })
);

export const messageTable = pgTable("messages", {
  id: defaultId(),
  chatId: tableIdRef(chatTable.id),
  userId: tableIdRef(userTable.id),
  text: text().notNull(),
  createdAt: defaultDate(),
});

export const messageFilesTable = pgTable("message_files", {
  id: defaultId(),
  messageId: tableIdRef(messageTable.id),
  fileId: uuid()
    .references(() => fileTable.id, { onDelete: "cascade" })
    .notNull(),
});

export const chatRelations = relations(chatTable, ({ many }) => ({
  members: many(chatMembersTable),
  messages: many(messageTable),
}));

export const chatMembersRelations = relations(chatMembersTable, ({ one }) => ({
  chat: one(chatTable, {
    fields: [chatMembersTable.chatId],
    references: [chatTable.id],
  }),
  user: one(userTable, {
    fields: [chatMembersTable.userId],
    references: [userTable.id],
  }),
}));

export const messageRelations = relations(messageTable, ({ one, many }) => ({
  chat: one(chatTable, {
    fields: [messageTable.chatId],
    references: [chatTable.id],
  }),
  user: one(userTable, {
    fields: [messageTable.userId],
    references: [userTable.id],
  }),
  files: many(messageFilesTable),
}));

export const messageFilesRelations = relations(
  messageFilesTable,
  ({ one }) => ({
    message: one(messageTable, {
      fields: [messageFilesTable.messageId],
      references: [messageTable.id],
    }),
    file: one(fileTable, {
      fields: [messageFilesTable.fileId],
      references: [fileTable.id],
    }),
  })
);
