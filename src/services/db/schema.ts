import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import DbUtils from "./utils";

export const roleEnum = pgEnum("user_role", [
  "operator",
  "admin",
  "client",
  "supervisor",
]);

const { defaultId, defaultDate, defaultVarChar, tableIdRef } = DbUtils;

export const notificationTypeEnum = pgEnum("notification_type", [
  "job_assigned",
  "job_updated",
  "job_completed",
  "system_message",
]);

export const userTable = pgTable("users", {
  id: defaultId(),
  lastName: defaultVarChar(),
  lastSeen: defaultDate(),
  firstName: defaultVarChar(),
  username: defaultVarChar(),
  password: defaultVarChar(),
  email: defaultVarChar().unique(),
  phone: text().notNull().default(""),
  avatar: uuid().references(() => fileTable.id),
  role: roleEnum("role").notNull().default("operator"),
});

export const userLocationTable = pgTable(
  "user_location",
  {
    id: defaultId(),
    userId: tableIdRef(userTable.id).notNull().unique(),
    latitude: doublePrecision(),
    longitude: doublePrecision(),
    updatedAt: defaultDate()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  (userLocation) => [index("user_location_user_id_idx").on(userLocation.userId)]
);

export const jobStatusEnum = pgEnum("job_status", [
  "scheduled",
  "pending",
  "inProgress",
  "completed",
]);

export const jobTable = pgTable(
  "job",
  {
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
  },
  (job) => [
    index("job_assigned_to_idx").on(job.assignedTo),
    index("job_created_by_idx").on(job.createdBy),
    index("job_start_date_idx").on(job.startDate),
    index("job_end_date_idx").on(job.endDate),
    index("job_date_range_idx").on(job.startDate, job.endDate),
  ]
);

export const jobReportTable = pgTable(
  "jobReport",
  {
    id: defaultId(),
    jobId: serial().references(() => jobTable.id, { onDelete: "cascade" }),
    signature: uuid().references(() => fileTable.id, {
      onDelete: "cascade",
    }),
    description: text().notNull().default(""),
    completedAt: defaultDate().notNull(),
  },
  (report) => [
    index("job_report_job_id_idx").on(report.jobId),
    index("job_report_id_idx").on(report.id),
  ]
);

export const jobReportFileTable = pgTable("jobReportFile", {
  fileId: uuid()
    .primaryKey()
    .references(() => fileTable.id, { onDelete: "cascade" }),
  jobReportId: serial().references(() => jobReportTable.id, {
    onDelete: "cascade",
  }),
});

export const jobTaskTable = pgTable(
  "jobTask",
  {
    id: defaultId(),
    completed: boolean().default(false).notNull(),
    title: defaultVarChar(),
    jobId: serial().references(() => jobTable.id, { onDelete: "cascade" }),
  },
  (task) => [index("job_task_job_id_idx").on(task.jobId)]
);

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

export const jobFiles = pgTable("job_file", {
  fileId: uuid()
    .primaryKey()
    .references(() => fileTable.id, { onDelete: "cascade" }),
  jobId: serial().references(() => jobTable.id, { onDelete: "cascade" }),
});

export const userAdminTable = pgTable("users_admin", {
  id: defaultId(),
  userId: tableIdRef(userTable.id).unique(),
  adminId: tableIdRef(userTable.id),
});

export const userSupervisorTable = pgTable("users_supervisor", {
  id: defaultId(),
  userId: tableIdRef(userTable.id).unique(),
  supervisorId: tableIdRef(userTable.id),
});

export const fileTable = pgTable("files", {
  id: uuid().primaryKey().defaultRandom(),
  fileName: defaultVarChar(),
});

export const jobFilesRelation = relations(jobFiles, ({ one }) => ({
  file: one(fileTable, {
    fields: [jobFiles.fileId],
    references: [fileTable.id],
  }),
  job: one(jobTable, {
    fields: [jobFiles.jobId],
    references: [jobTable.id],
  }),
}));

export const userNotificationRelation = relations(
  notificationTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [notificationTable.userId],
      references: [userTable.id],
    }),
  })
);

export const jobTaskRelation = relations(jobTaskTable, ({ one }) => ({
  job: one(jobTable, {
    fields: [jobTaskTable.jobId],
    references: [jobTable.id],
  }),
}));

export const userLocationRelation = relations(userLocationTable, ({ one }) => ({
  user: one(userTable, {
    fields: [userLocationTable.userId],
    references: [userTable.id],
  }),
}));

export const locationRelation = relations(userTable, ({ one }) => ({
  location: one(userLocationTable, {
    fields: [userTable.id],
    references: [userLocationTable.userId],
  }),
}));

export const jobReportRelation = relations(jobReportTable, ({ one, many }) => ({
  job: one(jobTable, {
    fields: [jobReportTable.jobId],
    references: [jobTable.id],
  }),
  signature: one(fileTable, {
    fields: [jobReportTable.signature],
    references: [fileTable.id],
  }),
  files: many(jobReportFileTable),
}));

export const jobReportFileRelation = relations(
  jobReportFileTable,
  ({ one }) => ({
    file: one(fileTable, {
      fields: [jobReportFileTable.fileId],
      references: [fileTable.id],
    }),
    report: one(jobReportTable, {
      fields: [jobReportFileTable.jobReportId],
      references: [jobReportTable.id],
    }),
  })
);
