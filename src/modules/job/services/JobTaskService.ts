import { and, eq, inArray } from "drizzle-orm";
import { status } from "elysia";
import { db } from "../../../services/db/db";
import { jobTable, jobTaskTable } from "../../../services/db/schema";
import { AppError } from "../../../utils/error";
import type { JobModel } from "../JobModel";
import { userJobAccessSubquery } from "./JobAccess";

export abstract class JobTaskService {
  static async getJobTasks(jobId: number, userId: number) {
    const tasks = await db
      .select({
        id: jobTaskTable.id,
        title: jobTaskTable.title,
        completed: jobTaskTable.completed,
        jobId: jobTaskTable.jobId,
      })
      .from(jobTaskTable)
      .where(
        and(
          eq(jobTaskTable.jobId, jobId),
          inArray(jobTaskTable.jobId, userJobAccessSubquery(jobId, userId))
        )
      );

    return status(200, tasks);
  }

  static async createJobTask(
    jobId: number,
    body: JobModel.JobTaskCreateBody,
    userId: number
  ) {
    const hasAccess = await db
      .select({ id: jobTable.id })
      .from(jobTable)
      .where(
        and(
          eq(jobTable.id, jobId),
          inArray(jobTable.id, userJobAccessSubquery(jobId, userId))
        )
      );

    if (hasAccess.length === 0) return AppError.Unauthorized;

    const task = await db
      .insert(jobTaskTable)
      .values({
        jobId,
        title: body.title,
        completed: body.completed,
      })
      .returning();

    return status(200, task[0]);
  }

  static async updateJobTask(body: JobModel.JobTaskUpdateBody, userId: number) {
    const updatedTask = await db
      .update(jobTaskTable)
      .set({
        title: body.title,
        completed: body.completed,
      })
      .where(
        and(
          eq(jobTaskTable.id, body.id),
          inArray(jobTaskTable.jobId, userJobAccessSubquery(body.jobId, userId))
        )
      )
      .returning();

    if (updatedTask.length === 0) return AppError.NotFound;

    return status(200, updatedTask);
  }

  static async deleteJobTask(taskId: number, userId: number) {
    const task = await db
      .select({ id: jobTaskTable.id, jobId: jobTaskTable.jobId })
      .from(jobTaskTable)
      .where(eq(jobTaskTable.id, taskId))
      .limit(1);

    if (task.length === 0) return AppError.NotFound;

    const hasAccess = await db
      .select({ id: jobTaskTable.id })
      .from(jobTaskTable)
      .where(
        and(
          eq(jobTaskTable.id, taskId),
          inArray(
            jobTaskTable.jobId,
            userJobAccessSubquery(task[0].jobId, userId)
          )
        )
      );

    if (hasAccess.length === 0) return AppError.NotFound;

    await db.delete(jobTaskTable).where(eq(jobTaskTable.id, taskId));

    return status(200, null);
  }
}
