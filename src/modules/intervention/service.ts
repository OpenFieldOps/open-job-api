import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "../../services/db/db";
import { interventionTable, userAdminTable } from "../../services/db/schema";
import { UserModel } from "../user/model";
import { InterventionModel } from "./model";
import { AppError } from "../../utils/error";
import { status } from "elysia";

export abstract class InterventionService {
  static async createIntervention(
    body: InterventionModel.InterventionCreateBody,
    userId: number
  ) {
    const isAManagerUser = (
      await db
        .select({
          id: userAdminTable.id,
        })
        .from(userAdminTable)
        .where(
          and(
            eq(userAdminTable.adminId, userId),
            eq(userAdminTable.userId, body.assignedTo)
          )
        )
    ).pop();
    if (!isAManagerUser) {
      return AppError.Unauthorized;
    }

    const intervention = (
      await db
        .insert(interventionTable)

        .values({
          title: body.title,
          description: body.description,
          assignedTo: body.assignedTo,
          createdBy: userId,
        })

        .returning()
    )[0];

    return status(200, intervention);
  }

  static async getInterventionById(id: number) {
    const intervention = await db
      .select()
      .from(interventionTable)
      .where(eq(interventionTable.id, id))
      .limit(1);

    if (intervention.length === 0) {
      return AppError.NotFound;
    }

    return intervention[0];
  }

  static async fetchIntervention(
    { role, id }: UserModel.UserIdAndRole,
    query: InterventionModel.InterventionSelectQuery
  ): Promise<InterventionModel.InterventionList> {
    const tableUserId =
      role === "admin"
        ? interventionTable.createdBy
        : interventionTable.assignedTo;

    const interventions = await db
      .select()
      .from(interventionTable)
      .where(
        and(
          eq(tableUserId, id),
          gte(interventionTable.startDate, query.start),
          lt(interventionTable.endDate, query.end)
        )
      );
    return interventions;
  }

  static async updateIntervention(
    body: InterventionModel.InterventionUpdateBody
  ) {
    await db
      .update(interventionTable)
      .set(body)
      .where(eq(interventionTable.id, body.id))
      .returning();
  }
}
