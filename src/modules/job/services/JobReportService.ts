import { and, eq, or } from "drizzle-orm";
import { status } from "elysia";
import { db } from "../../../services/db/db";
import {
  fileTable,
  jobReportFileTable,
  jobReportTable,
  jobTable,
} from "../../../services/db/schema";
import { FileStorageService } from "../../../services/storage/s3";
import { AppError } from "../../../utils/error";
import type { JobModel } from "../JobModel";
import { userJobAccessCondition } from "./JobAccess";

export abstract class JobReportService {
  static async createJobReport(
    body: JobModel.JobReportCreateBody,
    userId: number
  ) {
    const job = await db
      .select()
      .from(jobTable)
      .where(userJobAccessCondition(userId, body.jobId))
      .limit(1);

    if (job.length === 0) return AppError.Unauthorized;

    const signatureId = await FileStorageService.uploadFile(body.signature);

    const report = (
      await db
        .insert(jobReportTable)
        .values({
          jobId: body.jobId,
          signature: signatureId,
          description: body.description || "",
          completedAt: new Date().toISOString(),
        })
        .returning()
    )[0];

    if (body.files?.length) {
      await Promise.all(
        body.files.map((file) =>
          FileStorageService.uploadFile(file).then((fileId) =>
            db.insert(jobReportFileTable).values({
              fileId,
              jobReportId: report.id,
            })
          )
        )
      );
    }

    return status(200, report);
  }

  static async getJobReports(jobId: number, userId: number) {
    const reports = await db
      .select({
        id: jobReportTable.id,
        description: jobReportTable.description,
        completedAt: jobReportTable.completedAt,
        signature: jobReportTable.signature,
        jobId: jobReportTable.jobId,
      })
      .from(jobReportTable)
      .leftJoin(jobTable, eq(jobTable.id, jobReportTable.jobId))
      .where(
        and(
          eq(jobReportTable.jobId, jobId),
          or(eq(jobTable.assignedTo, userId), eq(jobTable.createdBy, userId))
        )
      );

    return status(200, reports);
  }

  static async getJobReportById(reportId: number, userId: number) {
    const report = await db
      .select()
      .from(jobReportTable)
      .leftJoin(jobTable, eq(jobTable.id, jobReportTable.jobId))
      .where(
        and(
          eq(jobReportTable.id, reportId),
          or(eq(jobTable.assignedTo, userId), eq(jobTable.createdBy, userId))
        )
      )
      .limit(1);

    if (report.length === 0) return AppError.NotFound;
    return status(200, report[0]);
  }

  static async updateJobReport(
    reportId: number,
    body: JobModel.JobReportUpdateBody,
    userId: number
  ) {
    const existingReport = await db
      .select()
      .from(jobReportTable)
      .leftJoin(jobTable, eq(jobTable.id, jobReportTable.jobId))
      .where(
        and(
          eq(jobReportTable.id, reportId),
          or(eq(jobTable.assignedTo, userId), eq(jobTable.createdBy, userId))
        )
      )
      .limit(1);

    if (existingReport.length === 0) return AppError.Unauthorized;

    const updatedReport = await db
      .update(jobReportTable)
      .set({ description: body.description })
      .where(eq(jobReportTable.id, reportId))
      .returning();

    if (body.files?.length) {
      await Promise.all(
        body.files.map((file) =>
          FileStorageService.uploadFile(file).then((fileId) =>
            db.insert(jobReportFileTable).values({
              fileId,
              jobReportId: reportId,
            })
          )
        )
      );
    }

    return status(200, updatedReport[0]);
  }

  static async deleteJobReport(reportId: number, userId: number) {
    const report = await db
      .select()
      .from(jobReportTable)
      .leftJoin(jobTable, eq(jobTable.id, jobReportTable.jobId))
      .where(
        and(
          eq(jobReportTable.id, reportId),
          or(eq(jobTable.assignedTo, userId), eq(jobTable.createdBy, userId))
        )
      )
      .limit(1);

    if (report.length === 0) return AppError.Unauthorized;

    const reportFiles = await db
      .select()
      .from(jobReportFileTable)
      .where(eq(jobReportFileTable.jobReportId, reportId));

    await Promise.all(
      reportFiles.map((file) => FileStorageService.deleteFile(file.fileId))
    );

    if (report[0].jobReport?.signature) {
      await FileStorageService.deleteFile(report[0].jobReport.signature);
    }

    await db.delete(jobReportTable).where(eq(jobReportTable.id, reportId));
    return status(200, null);
  }

  static async getJobReportFiles(reportId: number, userId: number) {
    const files = await db
      .select({
        id: fileTable.id,
        fileName: fileTable.fileName,
      })
      .from(jobReportFileTable)
      .innerJoin(fileTable, eq(fileTable.id, jobReportFileTable.fileId))
      .innerJoin(
        jobReportTable,
        eq(jobReportTable.id, jobReportFileTable.jobReportId)
      )
      .innerJoin(jobTable, eq(jobTable.id, jobReportTable.jobId))
      .where(
        and(
          eq(jobReportFileTable.jobReportId, reportId),
          or(eq(jobTable.assignedTo, userId), eq(jobTable.createdBy, userId))
        )
      );

    return status(200, files);
  }
}
