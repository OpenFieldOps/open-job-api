import { integer, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import DbUtils from "./utils";

export const roleEnum = pgEnum("user_role", ["user", "admin"]);
const { defaultId, defaultDate, defaultVarChar, tableIdRef } = DbUtils;

export const userTable = pgTable("users", {
	id: defaultId(),
	lastName: defaultVarChar(),
	firstName: defaultVarChar(),
	username: defaultVarChar().unique(),
	password: defaultVarChar(),
	email: defaultVarChar().unique(),
	avatar: integer()
		.references(() => fileTable.id)
		.default(1)
		.notNull(),
	role: roleEnum("role").notNull().default("user"),
});

export const jobStatusEnum = pgEnum("job_status", [
	"scheduled",
	"pending",
	"in_progress",
	"completed",
]);

export const jobTable = pgTable("Job", {
	id: defaultId(),
	title: defaultVarChar(),
	description: text().notNull().default(""),
	assignedTo: tableIdRef(userTable.id),
	createdBy: tableIdRef(userTable.id),
	createdAt: defaultDate(),
	updatedAt: defaultDate(),
	startDate: defaultDate().notNull(),
	endDate: defaultDate().notNull(),
	location: text().notNull().default(""),
	status: jobStatusEnum("status").notNull().default("scheduled"),
});

export const userAdminTable = pgTable("users_admin", {
	id: defaultId(),
	userId: tableIdRef(userTable.id)
		.unique()
		.references(() => userTable.id),
	adminId: tableIdRef(userTable.id),
});

export const fileTable = pgTable("files", {
	id: defaultId(),
	fileName: defaultVarChar(),
});
