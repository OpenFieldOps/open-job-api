import { and, eq, inArray } from "drizzle-orm";
import { status } from "elysia";
import { db } from "../../../services/db/db";
import {
  jobOperatorTable,
  jobTable,
  userAdminTable,
  userTable,
} from "../../../services/db/schema";
import { AppError } from "../../../utils/error";
import { UserModel } from "../../user/UserModel";
import type { JobModel } from "../JobModel";

export abstract class JobOperatorService {
  static async getJobOperators(jobId: number, userId: number) {
    const job = await db
      .select()
      .from(jobTable)
      .where(and(eq(jobTable.id, jobId), eq(jobTable.createdBy, userId)))
      .limit(1);

    if (job.length === 0) return AppError.Unauthorized;

    const operators = await db
      .select(UserModel.userWithoutPasswordSelect)
      .from(jobOperatorTable)
      .innerJoin(userTable, eq(jobOperatorTable.operatorId, userTable.id))
      .where(eq(jobOperatorTable.jobId, jobId));

    return status(200, operators);
  }

  static async assignOperatorsToJob(
    jobId: number,
    operatorIds: number[],
    adminId: number
  ) {
    const job = await db
      .select()
      .from(jobTable)
      .where(and(eq(jobTable.id, jobId), eq(jobTable.createdBy, adminId)))
      .limit(1);

    if (job.length === 0) return AppError.Unauthorized;

    if (operatorIds.length > 0) {
      const managedUsers = await db
        .select({ userId: userAdminTable.userId })
        .from(userAdminTable)
        .where(
          and(
            eq(userAdminTable.adminId, adminId),
            inArray(userAdminTable.userId, operatorIds)
          )
        );

      if (managedUsers.length !== operatorIds.length) {
        return AppError.Unauthorized;
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(jobOperatorTable)
        .where(eq(jobOperatorTable.jobId, jobId));

      if (operatorIds.length > 0) {
        await tx.insert(jobOperatorTable).values(
          operatorIds.map((operatorId) => ({
            jobId,
            operatorId,
            assignedAt: new Date().toISOString(),
          }))
        );
      }
    });

    return status(200, { success: true });
  }

  static async updateJobOperators(
    body: JobModel.JobOperatorUpdateBody,
    userId: number
  ) {
    return JobOperatorService.assignOperatorsToJob(
      body.jobId,
      body.operatorIds,
      userId
    );
  }

  static async isOperatorAssignedToJob(
    jobId: number,
    operatorId: number
  ): Promise<boolean> {
    const assignment = await db
      .select()
      .from(jobOperatorTable)
      .where(
        and(
          eq(jobOperatorTable.jobId, jobId),
          eq(jobOperatorTable.operatorId, operatorId)
        )
      )
      .limit(1);

    return assignment.length > 0;
  }

  static async getOperatorJobIds(operatorId: number): Promise<number[]> {
    const assignments = await db
      .select({ jobId: jobOperatorTable.jobId })
      .from(jobOperatorTable)
      .where(eq(jobOperatorTable.operatorId, operatorId));

    return assignments.map((a) => a.jobId);
  }
}
