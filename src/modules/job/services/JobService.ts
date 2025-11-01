import { and, eq, gte, inArray, lt, not } from "drizzle-orm";
import { status } from "elysia";
import { db } from "../../../services/db/db";
import {
  jobOperatorTable,
  jobTable,
  userAdminTable,
} from "../../../services/db/schema";
import { AppError } from "../../../utils/error";
import { UserNotificationModel } from "../../notification/NotificationModel";
import { UserNotificationSerice } from "../../notification/NotificationService";
import type { UserModel } from "../../user/UserModel";
import type { JobModel } from "../JobModel";
import { userJobAccessCondition } from "./JobAccess";
import { JobOperatorService } from "./JobOperatorService";

export abstract class JobService {
  static async createJob(body: JobModel.JobCreateBody, userId: number) {
    if (body.operatorIds.length > 0) {
      const managedUsers = await db
        .select({ id: userAdminTable.id })
        .from(userAdminTable)
        .where(
          and(
            eq(userAdminTable.adminId, userId),
            inArray(userAdminTable.userId, body.operatorIds)
          )
        );

      if (managedUsers.length !== body.operatorIds.length) {
        return AppError.Unauthorized;
      }
    }

    const job = await db.transaction(async (tx) => {
      const [createdJob] = await tx
        .insert(jobTable)
        .values({
          title: body.title,
          description: body.description,
          startDate: body.startDate,
          endDate: body.endDate,
          assignedClient: body.assignedClient,
          status: body.status || "scheduled",
          createdBy: userId,
        })
        .returning();

      if (body.operatorIds.length > 0) {
        await tx.insert(jobOperatorTable).values(
          body.operatorIds.map((operatorId) => ({
            jobId: createdJob.id,
            operatorId,
            assignedAt: new Date().toISOString(),
          }))
        );
      }

      return createdJob;
    });

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

    let jobIds: number[] | undefined;

    if (query.operatorId) {
      jobIds = await JobOperatorService.getOperatorJobIds(query.operatorId);
    } else {
      const operatorJobIds = await JobOperatorService.getOperatorJobIds(id);
      const createdJobs = await db
        .select({ id: jobTable.id })
        .from(jobTable)
        .where(eq(jobTable.createdBy, id));

      jobIds = [
        ...operatorJobIds,
        ...createdJobs.map((j) => j.id),
      ];
    }

    if (jobIds.length === 0) {
      return [];
    }

    const jobs = await db
      .select()
      .from(jobTable)
      .where(
        and(
          inArray(jobTable.id, jobIds),
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
    const hasAccess = await userJobAccessCondition(user.id, body.id);
    if (!hasAccess) return AppError.Unauthorized;

    const filteredBody = user.role === "admin" ? body : { status: body.status };

    const job = (
      await db
        .update(jobTable)
        .set(filteredBody)
        .where(eq(jobTable.id, body.id))
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
    const hasAccess = await userJobAccessCondition(userId, jobId);
    if (!hasAccess) return AppError.NotFound;

    const deleted = await db
      .delete(jobTable)
      .where(eq(jobTable.id, jobId))
      .returning();

    if (deleted.length === 0) return AppError.NotFound;
    return status(200, null);
  }

  static async getJobById(id: number, userId: number) {
    const hasAccess = await userJobAccessCondition(userId, id);
    if (!hasAccess) return AppError.NotFound;

    const job = await db
      .select()
      .from(jobTable)
      .where(eq(jobTable.id, id))
      .limit(1);

    if (job.length === 0) return AppError.NotFound;
    return job[0];
  }
}
