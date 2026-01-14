import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import DbUtils from "../../utils";
import { jobStatusEnum } from "../enums";
import { chatTable } from "./chat";
import { fileTable } from "./files";
import { userTable } from "./users";

const { defaultId, defaultDate, defaultVarChar, tableIdRef } = DbUtils;

export const jobTable = pgTable(
  "job",
  {
    id: defaultId(),
    title: defaultVarChar(),
    description: text().notNull().default(""),
    chatId: integer()
      .references(() => chatTable.id, { onDelete: "cascade" })
      .notNull(),
    assignedClient: integer().references(() => userTable.id, {
      onDelete: "cascade",
    }),
    broadcast: boolean().notNull().default(true),
    createdBy: tableIdRef(userTable.id),
    createdAt: defaultDate(),
    updatedAt: defaultDate(),
    startDate: defaultDate().notNull(),
    endDate: defaultDate().notNull(),
    location: text().notNull().default(""),
    status: jobStatusEnum("status").notNull().default("scheduled"),
  },
  (job) => [
    index("job_assigned_client_idx").on(job.assignedClient),
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

export const jobFiles = pgTable("job_file", {
  fileId: uuid()
    .primaryKey()
    .references(() => fileTable.id, { onDelete: "cascade" }),
  jobId: serial().references(() => jobTable.id, { onDelete: "cascade" }),
});

export const jobOperatorTable = pgTable(
  "jobOperator",
  {
    id: defaultId(),
    jobId: serial()
      .notNull()
      .references(() => jobTable.id, { onDelete: "cascade" }),
    operatorId: serial()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    assignedAt: defaultDate().notNull(),
  },
  (table) => [
    index("job_operator_job_id_idx").on(table.jobId),
    index("job_operator_operator_id_idx").on(table.operatorId),
  ]
);
