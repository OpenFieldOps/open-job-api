import { and, eq, inArray, or } from "drizzle-orm";
import { status } from "elysia";
import { db } from "../../../services/db/db";
import {
  fileTable,
  jobOperatorTable,
  jobReportFileTable,
  jobReportTable,
  jobTable,
} from "../../../services/db/schema";
import { FileStorageService } from "../../../services/storage/s3";
import { AppError } from "../../../utils/error";
import type { JobModel } from "../JobModel";
import { userJobAccessSubquery } from "./JobAccess";

function relatedUserJobAccessSubquery(userId: number) {
  return db
    .select({ id: jobTable.id })
    .from(jobTable)
    .leftJoin(jobOperatorTable, eq(jobTable.id, jobOperatorTable.jobId))
    .where(
      or(
        eq(jobTable.createdBy, userId),
        eq(jobOperatorTable.operatorId, userId)
      )
    );
}

export abstract class JobReportService {
  static async createJobReport(
    body: JobModel.JobReportCreateBody,
    userId: number
  ) {
    const jobAccess = await db
      .select({ id: jobTable.id })
      .from(jobTable)
      .where(
        and(
          eq(jobTable.id, body.jobId),
          inArray(jobTable.id, userJobAccessSubquery(body.jobId, userId))
        )
      );

    if (jobAccess.length === 0) return AppError.Unauthorized;

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
      .innerJoin(jobTable, eq(jobReportTable.jobId, jobTable.id))
      .where(
        and(
          eq(jobReportTable.jobId, jobId),
          inArray(jobTable.id, userJobAccessSubquery(jobId, userId))
        )
      );

    return status(200, reports);
  }

  static async getJobReportById(reportId: number, userId: number) {
    const report = await db
      .select({
        id: jobReportTable.id,
        description: jobReportTable.description,
        completedAt: jobReportTable.completedAt,
        signature: jobReportTable.signature,
        jobId: jobReportTable.jobId,
      })
      .from(jobReportTable)
      .innerJoin(jobTable, eq(jobReportTable.jobId, jobTable.id))
      .where(
        and(
          eq(jobReportTable.id, reportId),
          inArray(jobTable.id, relatedUserJobAccessSubquery(userId))
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
    const updatedReport = await db
      .update(jobReportTable)
      .set({ description: body.description })
      .where(
        and(
          eq(jobReportTable.id, reportId),
          inArray(
            jobReportTable.jobId,
            db
              .select({ id: jobTable.id })
              .from(jobReportTable)
              .innerJoin(jobTable, eq(jobReportTable.jobId, jobTable.id))
              .where(
                and(
                  eq(jobReportTable.id, reportId),
                  inArray(jobTable.id, relatedUserJobAccessSubquery(userId))
                )
              )
          )
        )
      )
      .returning();

    if (updatedReport.length === 0) return AppError.NotFound;

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
      .select({
        id: jobReportTable.id,
        signature: jobReportTable.signature,
        jobId: jobReportTable.jobId,
      })
      .from(jobReportTable)
      .innerJoin(jobTable, eq(jobReportTable.jobId, jobTable.id))
      .where(
        and(
          eq(jobReportTable.id, reportId),
          inArray(jobTable.id, relatedUserJobAccessSubquery(userId))
        )
      )
      .limit(1);

    if (report.length === 0) return AppError.NotFound;

    const reportFiles = await db
      .select()
      .from(jobReportFileTable)
      .where(eq(jobReportFileTable.jobReportId, reportId));

    await Promise.all(
      reportFiles.map((file) => FileStorageService.deleteFile(file.fileId))
    );

    if (report[0].signature) {
      await FileStorageService.deleteFile(report[0].signature);
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
        eq(jobReportFileTable.jobReportId, jobReportTable.id)
      )
      .innerJoin(jobTable, eq(jobReportTable.jobId, jobTable.id))
      .where(
        and(
          eq(jobReportFileTable.jobReportId, reportId),
          inArray(jobTable.id, relatedUserJobAccessSubquery(userId))
        )
      );

    return status(200, files);
  }
}
