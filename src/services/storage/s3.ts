import { S3Client } from "bun";
import { eq } from "drizzle-orm";
import { config } from "../../config";
import { db } from "../db/db";
import { fileTable } from "../db/schema";

const s3Client = new S3Client({
	accessKeyId: config.storage.s3_access_key_id,
	secretAccessKey: config.storage.s3_secret_access_key,
	bucket: config.storage.s3_bucket_name,
	endpoint: config.storage.s3_endpoint,
});

export type FileId = string;

export abstract class FileStorageService {
	static async uploadFile(file: File): Promise<FileId> {
		const fileId: FileId = (
			await db
				.insert(fileTable)
				.values({
					fileName: file.name,
				})
				.returning({ id: fileTable.id })
		)[0].id;

		const s3File = s3Client.file(fileId);

		await s3File.write(file);

		return fileId;
	}

	static async deleteFile(fileId: FileId): Promise<void> {
		const s3File = s3Client.file(fileId);
		await s3File.delete();
		await db.delete(fileTable).where(eq(fileTable.id, fileId));
	}

	static getFileUrl(fileId: FileId): string {
		return s3Client.presign(fileId.toString(), {
			expiresIn: 3600,
			method: "GET",
			type: "application/octet-stream",
		});
	}
}

if (Bun.env.NODE_ENV === "test" || Bun.env.NODE_ENV === "development") {
	// we cannot use minio in github actions
	FileStorageService.uploadFile = async (file: File): Promise<FileId> => {
		const fileId = await db
			.insert(fileTable)
			.values({
				fileName: file.name,
			})
			.returning({ id: fileTable.id });

		return fileId[0].id;
	};

	FileStorageService.getFileUrl = (fileId: FileId): string => {
		return `/files/${fileId}`;
	};
}
