import { t } from "elysia";
import type {
	chatMembersTable,
	chatTable,
	messageFilesTable,
	messageTable,
} from "../../services/db/schema";

export namespace ChatModel {
	export type Chat = typeof chatTable.$inferSelect;
	export type ChatMember = typeof chatMembersTable.$inferSelect;
	export type Message = typeof messageTable.$inferSelect;
	export type MessageFile = typeof messageFilesTable.$inferSelect;

	export const SendMessageBody = t.Object({
		text: t.String(),
		files: t.Optional(t.Files()),
	});

	export type SendMessageBody = typeof SendMessageBody.static;

	export type ChatWithLastMessage = {
		id: number;
		name: string;
		createdAt: string;
		updatedAt: string;
		lastMessage: {
			text: string;
			createdAt: string;
			userId: number;
		} | null;
	};

	export type MessageWithFiles = {
		id: number;
		chatId: number;
		userId: number;
		text: string;
		createdAt: string;
		files: {
			id: string;
			fileName: string;
		}[];
	};
}
