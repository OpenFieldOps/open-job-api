import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";
import { interventionTable } from "../../services/db/schema";

export namespace InterventionModel {
  export type Intervention = typeof Intervention.static;
  export type InterventionSelectQuery = typeof InterventionSelectQuery.static;
  export type InterventionList = typeof InterventionList.static;
  export type InterventionCreateBody = typeof InterventionCreateBody.static;
  export type InterventionUpdateBody = typeof InterventionUpdateBody.static;

  export enum InterventionStatusEnum {
    Scheduled = "scheduled",
    Pending = "pending",
    InProgress = "in_progress",
    Completed = "completed",
  }

  export const InterventionStatusString = t.String();

  export type InterventionStatusString =
    | "scheduled"
    | "pending"
    | "in_progress"
    | "completed";

  export const Intervention = createSelectSchema(interventionTable);

  export const InterventionSelectQuery = t.Object({
    start: t.String(),
    end: t.String(),
  });

  const _InterventionCreateBody = createInsertSchema(interventionTable);

  export const InterventionCreateBody = t.Intersect([
    t.Omit(_InterventionCreateBody, [
      "id",
      "createdBy",
      "createdAt",
      "updatedAt",
    ]),
    t.Object({
      title: t.String({ minLength: 3 }),
    }),
  ]);

  export const InterventionUpdateBody = t.Object({
    id: t.Integer(),
    title: t.Optional(t.String({ minLength: 3 })),
    description: t.Optional(t.String()),
    assignedTo: t.Optional(t.Integer()),
    startDate: t.Optional(t.String()),
    endDate: t.Optional(t.String()),
    status: t.Optional(t.Enum(InterventionStatusEnum)),
  });

  export const InterventionList = t.Array(Intervention);
}
