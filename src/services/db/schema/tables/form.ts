import { integer, pgEnum, pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { userTable } from "./users";

export const formTemplateTable = pgTable("form_templates", {
	id: serial().primaryKey(),
	userId: integer()
		.notNull()
		.references(() => userTable.id),
	name: varchar({ length: 255 }).notNull(),
});

export const formColumnEnum = pgEnum("form_column", ["LEFT", "RIGHT"]);

export const formFieldTemplateTable = pgTable("form_field_templates", {
	id: serial().primaryKey(),
	templateId: integer()
		.notNull()
		.references(() => formTemplateTable.id),

	rowIndex: integer().notNull(),
	column: formColumnEnum("column").notNull().default("LEFT"),
});

export const formEntryTable = pgTable("form_entries", {
	id: serial().primaryKey(),
	templateId: integer()
		.notNull()
		.references(() => formTemplateTable.id),
});

export const formFieldEntryTable = pgTable("form_field_entries", {
	id: serial().primaryKey(),
	formEntryId: integer()
		.notNull()
		.references(() => formEntryTable.id),
	fieldTemplateId: integer()
		.notNull()
		.references(() => formFieldTemplateTable.id),
});
