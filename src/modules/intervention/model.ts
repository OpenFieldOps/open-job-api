import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";
import { interventionTable } from "../../services/db/schema";

export namespace InterventionModel {
  export type Intervention = typeof Intervention.static;
  export type InterventionSelectQuery = typeof InterventionSelectQuery.static;
  export type InterventionList = typeof InterventionList.static;
  export type InterventionCreateBody = typeof InterventionCreateBody.static;
  export type InterventionUpdateBody = typeof InterventionUpdateBody.static;

  export const Intervention = createSelectSchema(interventionTable);

  export const InterventionSelectQuery = t.Object({
    start: t.String(),
    end: t.String(),
  });

  const _InterventionCreateBody = createInsertSchema(interventionTable);

  export const InterventionCreateBody = t.Omit(_InterventionCreateBody, [
    "id",
    "createdBy",
    "createdAt",
    "updatedAt",
  ]);

  export const InterventionUpdateBody = t.Object({
    id: t.Integer(),
    title: t.Optional(t.String()),
    description: t.Optional(t.String()),
    assignedTo: t.Optional(t.Integer()),
    startDate: t.Optional(t.String()),
    endDate: t.Optional(t.String()),
  });

  export const InterventionList = t.Array(Intervention);
}
