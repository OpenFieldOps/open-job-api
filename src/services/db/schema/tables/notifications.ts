import { boolean, index, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import DbUtils from "../../utils";
import { notificationTypeEnum } from "../enums";
import { userTable } from "./users";

const { defaultId, defaultDate, defaultVarChar, tableIdRef } = DbUtils;

export const notificationTable = pgTable(
  "notification",
  {
    id: defaultId(),
    userId: tableIdRef(userTable.id).notNull(),
    title: defaultVarChar().notNull(),
    message: text().notNull(),
    createdAt: defaultDate().notNull(),
    payload: jsonb("payload").notNull().default("{}"),
    type: notificationTypeEnum("type").notNull().default("system_message"),
    isRead: boolean("is_read").notNull().default(false),
  },
  (notif) => [
    index("notification_user_id_idx").on(notif.userId),
    index("notification_is_read_idx").on(notif.isRead),
  ]
);
