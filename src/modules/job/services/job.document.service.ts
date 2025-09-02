import { eq } from "drizzle-orm";
import { db } from "../../../services/db/db";
import { fileTable, jobFiles, jobTable } from "../../../services/db/schema";
import { FileStorageService } from "../../../services/storage/s3";
import { AppError } from "../../../utils/error";
import type { FileModel } from "../../models/FileModel";
import { userJobAccessCondition } from "./access";

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
      .innerJoin(jobTable, eq(jobTable.id, jobFiles.jobId))
      .where(userJobAccessCondition(userId, jobId));
  }

  static async createJobDocument(jobId: number, file: File, userId: number) {
    const job = await db
      .select()
      .from(jobTable)
      .where(userJobAccessCondition(userId, jobId))
      .limit(1);

    if (job.length === 0) return AppError.Unauthorized;

    const fileId = await FileStorageService.uploadFile(file);
    await db.insert(jobFiles).values({ fileId, jobId });

    return { id: fileId, fileName: file.name };
  }

  static async deleteJobDocument(
    jobId: number,
    userId: number,
    fileId: string
  ) {
    const userJob = db
      .$with("user_job")
      .as(
        db
          .select()
          .from(jobFiles)
          .innerJoin(jobTable, eq(jobTable.id, jobFiles.jobId))
          .where(userJobAccessCondition(userId, jobId))
      );

    await db.with(userJob).delete(jobFiles).where(eq(jobFiles.fileId, fileId));
    await FileStorageService.deleteFile(fileId);
  }
}
