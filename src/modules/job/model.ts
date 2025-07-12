import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";
import { jobTable } from "../../services/db/schema";

export namespace JobModel {
  export type Job = typeof Job.static;
  export type JobSelectQuery = typeof JobSelectQuery.static;
  export type JobList = typeof JobList.static;
  export type JobCreateBody = typeof JobCreateBody.static;
  export type JobUpdateBody = typeof JobUpdateBody.static;

  export enum JobStatusEnum {
    Scheduled = "scheduled",
    Pending = "pending",
    InProgress = "in_progress",
    Completed = "completed",
  }

  export const JobStatusString = t.String();

  export type JobStatusString =
    | "scheduled"
    | "pending"
    | "in_progress"
    | "completed";

  export const Job = createSelectSchema(jobTable);

  export const JobSelectQuery = t.Object({
    start: t.String(),
    end: t.String(),
  });

  const _JobCreateBody = createInsertSchema(jobTable);

  export const JobCreateBody = t.Intersect([
    t.Omit(_JobCreateBody, ["id", "createdBy", "createdAt", "updatedAt"]),
    t.Object({
      title: t.String({ minLength: 3 }),
    }),
  ]);

  export const JobUpdateBody = t.Object({
    id: t.Integer(),
    title: t.Optional(t.String({ minLength: 3 })),
    description: t.Optional(t.String()),
    assignedTo: t.Optional(t.Integer()),
    startDate: t.Optional(t.String()),
    endDate: t.Optional(t.String()),
    status: t.Optional(t.Enum(JobStatusEnum)),
  });

  export const JobList = t.Array(Job);
}
