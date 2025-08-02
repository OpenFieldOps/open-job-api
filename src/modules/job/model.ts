import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { status, t } from "elysia";
import { jobTable, type jobTaskTable } from "../../services/db/schema";

export namespace JobModel {
  export type Job = typeof Job.static;
  export type JobSelectQuery = typeof JobSelectQuery.static;
  export type JobList = typeof JobList.static;
  export type JobCreateBody = typeof JobCreateBody.static;
  export type JobUpdateBody = typeof JobUpdateBody.static;
  export type JobTaskCreateBody = typeof JobTaskCreateBody.static;
  export type JobTaskUpdateBody = typeof JobTaskUpdateBody.static;
  export type JobTask = typeof jobTaskTable.$inferSelect;

  export const JobStatusString = t.String();

  export type JobStatusString =
    | "scheduled"
    | "pending"
    | "inProgress"
    | "completed";

  export const Job = createSelectSchema(jobTable);

  export const JobSelectQuery = t.Partial(
    t.Object({
      start: t.String(),
      end: t.String(),
      status: t.UnionEnum(
        ["scheduled", "pending", "inProgress", "completed", "none"],
        {
          default: "none",
        }
      ),
    })
  );

  const _JobCreateBody = createInsertSchema(jobTable);

  export const JobCreateBody = t.Intersect([
    t.Omit(_JobCreateBody, ["id", "createdBy", "createdAt", "updatedAt"]),
    t.Object({
      title: t.String({
        minLength: 3,
        error: {
          constructor: () =>
            status(422, "Title must be at least 3 characters long"),
        },
      }),
    }),
  ]);

  export const JobUpdateBody = t.Object({
    id: t.Integer(),
    title: t.Optional(t.String({ minLength: 3 })),
    description: t.Optional(t.String()),
    assignedTo: t.Optional(t.Integer()),
    startDate: t.Optional(t.String()),
    endDate: t.Optional(t.String()),
    location: t.Optional(t.String()),
    status: t.Optional(
      t.UnionEnum(["scheduled", "pending", "inProgress", "completed"])
    ),
  });

  export const JobTaskCreateBody = t.Object({
    title: t.String({ minLength: 3 }),

    completed: t.Optional(t.Boolean()),
    jobId: t.Integer(),
  });

  export const JobTaskUpdateBody = t.Object({
    id: t.Integer(),
    title: t.Optional(t.String({ minLength: 3 })),
    completed: t.Optional(t.Boolean()),
  });

  export const JobList = t.Array(Job);
}
