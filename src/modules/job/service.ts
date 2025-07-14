import { and, eq, gte, lt, or } from "drizzle-orm";
import { db } from "../../services/db/db";
import { jobTable, userAdminTable } from "../../services/db/schema";
import type { UserModel } from "../user/model";
import type { JobModel } from "./model";
import { AppError } from "../../utils/error";
import { status } from "elysia";

export abstract class JobService {
  static async createJob(body: JobModel.JobCreateBody, userId: number) {
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
    const job = (
      await db
        .insert(jobTable)
        .values({
          title: body.title,
          description: body.description,
          startDate: body.startDate,
          endDate: body.endDate,
          assignedTo: body.assignedTo,
          createdBy: userId,
        })

        .returning()
    )[0];

    return status(200, job);
  }

  static async getJobById(id: number) {
    const job = await db
      .select()
      .from(jobTable)
      .where(eq(jobTable.id, id))
      .limit(1);

    if (job.length === 0) {
      return AppError.NotFound;
    }

    return job[0];
  }

  static async fetchJob(
    { id }: UserModel.UserIdAndRole,
    query: JobModel.JobSelectQuery
  ): Promise<JobModel.JobList> {
    const jobs = await db
      .select()
      .from(jobTable)
      .where(
        and(
          or(eq(jobTable.assignedTo, id), eq(jobTable.createdBy, id)),
          gte(jobTable.startDate, query.start),
          lt(jobTable.endDate, query.end)
        )
      );
    return jobs;
  }

  static async updateJob(body: JobModel.JobUpdateBody) {
    await db
      .update(jobTable)
      .set(body)
      .where(eq(jobTable.id, body.id))
      .returning();
  }

  static async deleteJob(JobId: number, userId: number) {
    try {
      const deleted = await db
        .delete(jobTable)
        .where(and(eq(jobTable.id, JobId), eq(jobTable.createdBy, userId)))
        .returning();

      if (deleted.length === 0) {
        return AppError.NotFound;
      }

      return status(200, null);
    } catch {
      return AppError.Unauthorized;
    }
  }
}
