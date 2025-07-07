import { and, eq } from "drizzle-orm";
import { db } from "../../services/db/db";
import { interventionTable, userAdminTable } from "../../services/db/schema";
import { UserModel } from "../user/model";
import { InterventionModel } from "./model";

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
      throw new Error("You are not allowed to assign this user.");
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

    return intervention;
  }

  static async fetchIntervention({ role, id }: UserModel.UserIdAndRole) {
    const tableUserId =
      role === "admin"
        ? interventionTable.createdBy
        : interventionTable.assignedTo;

    const interventions = await db
      .select()
      .from(interventionTable)
      .where(eq(tableUserId, id));

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
