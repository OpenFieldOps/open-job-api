import { eq } from "drizzle-orm";
import { db } from "../../../services/db/db";
import { fileTable, jobFiles } from "../../../services/db/schema";
import { FileStorageService } from "../../../services/storage/s3";
import { AppError } from "../../../utils/error";
import type { FileModel } from "../../models/FileModel";
import { userJobAccessCondition } from "./JobAccess";

export abstract class JobDocumentService {
  static async fetchJobDocuments(
    jobId: number,
    userId: number
  ): Promise<FileModel.DbFile[]> {
    const hasAccess = await userJobAccessCondition(userId, jobId);
    if (!hasAccess) return [];

    return db
      .select({
        id: fileTable.id,
        fileName: fileTable.fileName,
      })
      .from(jobFiles)
      .innerJoin(fileTable, eq(fileTable.id, jobFiles.fileId))
      .where(eq(jobFiles.jobId, jobId));
  }

  static async createJobDocument(jobId: number, file: File, userId: number) {
    const hasAccess = await userJobAccessCondition(userId, jobId);
    if (!hasAccess) return AppError.Unauthorized;

    const fileId = await FileStorageService.uploadFile(file);
    await db.insert(jobFiles).values({ fileId, jobId });

    return { id: fileId, fileName: file.name };
  }

  static async deleteJobDocument(
    jobId: number,
    userId: number,
    fileId: string
  ) {
    const hasAccess = await userJobAccessCondition(userId, jobId);
    if (!hasAccess) return AppError.Unauthorized;

    await db.delete(jobFiles).where(eq(jobFiles.fileId, fileId));
    await FileStorageService.deleteFile(fileId);
  }
}
