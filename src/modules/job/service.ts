import { and, eq, gte, lt, or } from "drizzle-orm";
import { status } from "elysia";
import { db } from "../../services/db/db";
import {
	fileTable,
	jobFiles,
	jobTable,
	userAdminTable,
} from "../../services/db/schema";
import { FileStorageService } from "../../services/storage/s3";
import { AppError } from "../../utils/error";
import type { UserModel } from "../user/model";
import type { JobModel } from "./model";

function userJobAccessCondition(userId: number, jobId: number) {
	return and(
		eq(jobTable.id, jobId),
		or(eq(jobTable.assignedTo, userId), eq(jobTable.createdBy, userId)),
	);
}

export abstract class JobService {
	static async createJob(body: JobModel.JobCreateBody, userId: number) {
		const isAManagerUser = (
			await db
				.select({
					id: userAdminTable.id,
				})
				.from(userAdminTable)
				.where(
					and(
						eq(userAdminTable.adminId, userId),
						eq(userAdminTable.userId, body.assignedTo),
					),
				)
		).pop();

		if (!isAManagerUser) {
			return AppError.Unauthorized;
		}
		const job = (
			await db
				.insert(jobTable)
				.values({
					title: body.title,
					description: body.description,
					startDate: body.startDate,
					endDate: body.endDate,
					assignedTo: body.assignedTo,
					createdBy: userId,
				})

				.returning()
		)[0];

		return status(200, job);
	}

	static async getJobById(id: number, userId: number) {
		const job = await db
			.select()
			.from(jobTable)
			.where(userJobAccessCondition(userId, id))
			.limit(1);

		if (job.length === 0) {
			return AppError.NotFound;
		}

		return job[0];
	}

	static async fetchJob(
		{ id }: UserModel.UserIdAndRole,
		query: JobModel.JobSelectQuery,
	): Promise<JobModel.JobList> {
		const jobs = await db
			.select()
			.from(jobTable)
			.where(
				and(
					or(eq(jobTable.assignedTo, id), eq(jobTable.createdBy, id)),
					gte(jobTable.startDate, query.start),
					lt(jobTable.endDate, query.end),
				),
			);
		return jobs;
	}

	static async fetchJobDocuments(jobId: number, userId: number) {
		const documents = await db
			.select({
				fileId: fileTable.id,
				fileName: fileTable.fileName,
			})
			.from(jobFiles)
			.innerJoin(fileTable, eq(fileTable.id, jobFiles.fileId))
			.innerJoin(jobTable, eq(jobTable.id, jobFiles.jobId))
			.where(userJobAccessCondition(userId, jobId));

		return documents;
	}

	static async createJobDocument(jobId: number, file: File, userId: number) {
		const fileId = await FileStorageService.uploadFile(file);
		const job = await db
			.select()
			.from(jobTable)
			.where(
				and(
					eq(jobTable.id, jobId),
					or(eq(jobTable.assignedTo, userId), eq(jobTable.createdBy, userId)),
				),
			)
			.limit(1);

		return {
			job,
			fileId,
		};
	}

	static async updateJob(body: JobModel.JobUpdateBody) {
		await db
			.update(jobTable)
			.set(body)
			.where(eq(jobTable.id, body.id))
			.returning();
	}

	static async deleteJob(jobId: number, userId: number) {
		try {
			const deleted = await db
				.delete(jobTable)
				.where(userJobAccessCondition(userId, jobId))
				.returning();

			if (deleted.length === 0) {
				return AppError.NotFound;
			}

			return status(200, null);
		} catch {
			return AppError.Unauthorized;
		}
	}
}
