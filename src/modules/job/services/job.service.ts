import { and, eq, gte, lt, not, or } from "drizzle-orm";
import { db } from "../../../services/db/db";
import { jobTable, userAdminTable } from "../../../services/db/schema";
import { AppError } from "../../../utils/error";
import type { JobModel } from ".././model";
import type { UserModel } from "../../user/model";
import { userJobAccessCondition } from "./access";
import { UserNotificationModel } from "../../notification/model";
import { UserNotificationSerice } from "../../notification/service";
import { status } from "elysia";

export abstract class JobService {
  static async createJob(body: JobModel.JobCreateBody, userId: number) {
    const isAManagerUser = (
      await db
        .select({ id: userAdminTable.id })
        .from(userAdminTable)
        .where(
          and(
            eq(userAdminTable.adminId, userId),
            eq(userAdminTable.userId, body.assignedTo)
          )
        )
    ).pop();

    if (!isAManagerUser) return AppError.Unauthorized;

    const job = (
      await db
        .insert(jobTable)
        .values({
          title: body.title,
          description: body.description,
          startDate: body.startDate,
          endDate: body.endDate,
          assignedTo: body.assignedTo,
          status: body.status || "scheduled",
          createdBy: userId,
        })
        .returning()
    )[0];

    return status(200, job);
  }

  static async fetchJob(
    { id }: UserModel.UserIdAndRole,
    query: JobModel.JobSelectQuery
  ): Promise<JobModel.JobList> {
    if (query.status === "none") {
      query.status = undefined;
    }
    if (query.notStatus === "none") {
      query.notStatus = undefined;
    }

    let userCondition = or(
      eq(jobTable.assignedTo, id),
      eq(jobTable.createdBy, id)
    );

    if (query.operatorId) {
      userCondition = eq(jobTable.assignedTo, query.operatorId);
    }

    const jobs = await db
      .select()
      .from(jobTable)
      .where(
        and(
          userCondition,
          query.start ? gte(jobTable.startDate, query.start) : undefined,
          query.end ? lt(jobTable.endDate, query.end) : undefined,
          query.status ? eq(jobTable.status, query.status) : undefined,
          query.notStatus
            ? not(eq(jobTable.status, query.notStatus))
            : undefined
        )
      );
    return jobs;
  }

  static async updateJob(
    body: JobModel.JobUpdateBody,
    user: UserModel.UserWithoutPassword
  ) {
    const filteredBody = user.role === "admin" ? body : { status: body.status };

    const job = (
      await db
        .update(jobTable)
        .set(filteredBody)
        .where(userJobAccessCondition(user.id, body.id))
        .returning()
    ).pop();

    if (!job) return AppError.Unauthorized;

    if (job.createdBy !== user.id && body.status === "completed") {
      UserNotificationSerice.sendNotification(job.createdBy, {
        title: "Job Completed",
        message: `Job "${job.title}" has been completed by ${user.firstName} ${user.lastName}.`,
        type: UserNotificationModel.UserNotificationType.JobCompleted,
        payload: {
          jobId: job.id,
        } as UserNotificationModel.UserNotificationInterventionPayload,
      });
    }
  }

  static async deleteJob(jobId: number, userId: number) {
    const deleted = await db
      .delete(jobTable)
      .where(userJobAccessCondition(userId, jobId))
      .returning();

    if (deleted.length === 0) return AppError.NotFound;
    return status(200, null);
  }

  static async getJobById(id: number, userId: number) {
    const job = await db
      .select()
      .from(jobTable)
      .where(userJobAccessCondition(userId, id))
      .limit(1);

    if (job.length === 0) return AppError.NotFound;
    return job[0];
  }
}
