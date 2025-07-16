import { S3Client } from "bun";
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

	static getFileUrl(fileId: FileId): string {
		return Bun.s3.presign(fileId.toString(), {
			expiresIn: 3600,
			method: "GET",
			type: "application/octet-stream",
		});
	}
}

if (Bun.env.NODE_ENV === "test" || Bun.env.NODE_ENV === "development") {
	// In development, we can use a local file system for testing purposes.
	// This is not recommended for production use.
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
