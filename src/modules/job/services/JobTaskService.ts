import { eq } from "drizzle-orm";
import { status } from "elysia";
import { db } from "../../../services/db/db";
import { jobTaskTable } from "../../../services/db/schema";
import { AppError } from "../../../utils/error";
import type { JobModel } from "../JobModel";
import { userJobAccessCondition } from "./JobAccess";

export abstract class JobTaskService {
  static async getJobTasks(jobId: number, userId: number) {
    const hasAccess = await userJobAccessCondition(userId, jobId);
    if (!hasAccess) return AppError.Unauthorized;

    const tasks = await db
      .select({
        id: jobTaskTable.id,
        title: jobTaskTable.title,
        completed: jobTaskTable.completed,
        jobId: jobTaskTable.jobId,
      })
      .from(jobTaskTable)
      .where(eq(jobTaskTable.jobId, jobId));

    return status(200, tasks);
  }

  static async createJobTask(
    jobId: number,
    body: JobModel.JobTaskCreateBody,
    userId: number
  ) {
    const hasAccess = await userJobAccessCondition(userId, jobId);
    if (!hasAccess) return AppError.Unauthorized;

    const task = (
      await db
        .insert(jobTaskTable)
        .values({
          jobId,
          title: body.title,
          completed: body.completed,
        })
        .returning()
    ).pop();

    if (!task) return AppError.Unauthorized;
    return status(200, task);
  }

  static async updateJobTask(
    jobId: number,
    body: JobModel.JobTaskUpdateBody,
    userId: number
  ) {
    const hasAccess = await userJobAccessCondition(userId, jobId);
    if (!hasAccess) return AppError.Unauthorized;

    const task = await db
      .update(jobTaskTable)
      .set({
        title: body.title,
        completed: body.completed,
      })
      .where(eq(jobTaskTable.id, body.id))
      .returning();

    return status(200, task);
  }

  static async deleteJobTask(jobId: number, taskId: number, userId: number) {
    const hasAccess = await userJobAccessCondition(userId, jobId);
    if (!hasAccess) return AppError.Unauthorized;

    const task = await db
      .delete(jobTaskTable)
      .where(eq(jobTaskTable.id, taskId))
      .returning();

    if (task.length === 0) return AppError.NotFound;
    return status(200, null);
  }
}
