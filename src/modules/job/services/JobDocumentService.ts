import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../../services/db/db";
import { fileTable, jobFiles, jobTable } from "../../../services/db/schema";
import { FileStorageService } from "../../../services/storage/s3";
import { AppError } from "../../../utils/error";
import type { FileModel } from "../../models/FileModel";
import { userJobAccessSubquery } from "./JobAccess";

export abstract class JobDocumentService {
  static async fetchJobDocuments(
    jobId: number,
    userId: number
  ): Promise<FileModel.DbFile[]> {
    return db
      .select({
        id: fileTable.id,
        fileName: fileTable.fileName,
      })
      .from(jobFiles)
      .innerJoin(fileTable, eq(fileTable.id, jobFiles.fileId))
      .innerJoin(jobTable, eq(jobFiles.jobId, jobTable.id))
      .where(
        and(
          eq(jobFiles.jobId, jobId),
          inArray(jobTable.id, userJobAccessSubquery(jobId, userId))
        )
      );
  }

  static async createJobDocument(jobId: number, file: File, userId: number) {
    const jobAccess = await db
      .select({ id: jobTable.id })
      .from(jobTable)
      .where(
        and(
          eq(jobTable.id, jobId),
          inArray(jobTable.id, userJobAccessSubquery(jobId, userId))
        )
      );

    if (jobAccess.length === 0) return AppError.Unauthorized;

    const fileId = await FileStorageService.uploadFile(file);
    await db.insert(jobFiles).values({ fileId, jobId });

    return { id: fileId, fileName: file.name };
  }

  static async deleteJobDocument(
    jobId: number,
    userId: number,
    fileId: string
  ) {
    const deleted = await db
      .delete(jobFiles)
      .where(
        and(
          eq(jobFiles.fileId, fileId),
          eq(jobFiles.jobId, jobId),
          inArray(
            jobFiles.jobId,
            userJobAccessSubquery(jobId, userId)
          )
        )
      )
      .returning();

    if (deleted.length === 0) return AppError.Unauthorized;

    await FileStorageService.deleteFile(fileId);
  }
}
