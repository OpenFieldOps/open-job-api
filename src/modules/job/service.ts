import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "../../services/db/db";
import { jobTable, userAdminTable } from "../../services/db/schema";
import { UserModel } from "../user/model";
import { JobModel } from "./model";
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
    const Job = await db
      .select()
      .from(jobTable)
      .where(eq(jobTable.id, id))
      .limit(1);

    if (Job.length === 0) {
      return AppError.NotFound;
    }

    return Job[0];
  }

  static async fetchJob(
    { role, id }: UserModel.UserIdAndRole,
    query: JobModel.JobSelectQuery
  ): Promise<JobModel.JobList> {
    const tableUserId =
      role === "admin" ? jobTable.createdBy : jobTable.assignedTo;

    const Jobs = await db
      .select()
      .from(jobTable)
      .where(
        and(
          eq(tableUserId, id),
          gte(jobTable.startDate, query.start),
          lt(jobTable.endDate, query.end)
        )
      );
    return Jobs;
  }

  static async updateJob(body: JobModel.JobUpdateBody) {
    await db
      .update(jobTable)
      .set(body)
      .where(eq(jobTable.id, body.id))
      .returning();
  }

  static async deleteJob(JobId: number, userId: number) {
    await db
      .delete(jobTable)
      .where(and(eq(jobTable.id, JobId), eq(jobTable.createdBy, userId)));
  }
}
