import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";
import { interventionTable } from "../../services/db/schema";

export namespace InterventionModel {
  // Types
  export type Intervention = typeof interventionTable.$inferSelect;

  // Schemas
  export const Intervention = createSelectSchema(interventionTable);
  const _InterventionCreateBody = createInsertSchema(interventionTable);
  export const InterventionCreateBody = t.Omit(_InterventionCreateBody, [
    "id",
    "createdAt",
    "updatedAt",
  ]);
  export const InterventionUpdateBody = t.Intersect([
    t.Pick(Intervention, ["id"]),
    t.Partial(t.Omit(Intervention, ["id", "createdAt", "updatedAt"])),
  ]);
  export const InterventionList = t.Array(Intervention);

  // Static Types
  export type InterventionList = typeof InterventionList.static;
  export type InterventionCreateBody = typeof InterventionCreateBody.static;
  export type InterventionUpdateBody = typeof InterventionUpdateBody.static;
}
