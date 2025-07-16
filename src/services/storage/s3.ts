import { S3Client } from "bun";
import { db } from "../db/db";
import { fileTable } from "../db/schema";

export const s3Client = new S3Client();

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
