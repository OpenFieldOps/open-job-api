import { and, eq, gte, lt, or } from "drizzle-orm";
import { status } from "elysia";
import { db } from "../../services/db/db";
import {
	fileTable,
	jobFiles,
	jobTable,
	jobTaskTable,
	userAdminTable,
} from "../../services/db/schema";
import { RealtimeModel } from "../../services/redis/model";
import { sendUserMessage } from "../../services/redis/utils";
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

function withUserJob(userId: number, jobId: number) {
	return db
		.$with("job")
		.as(
			db.select().from(jobTable).where(userJobAccessCondition(userId, jobId)),
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

	static async updateJob(
		body: JobModel.JobUpdateBody,
		user: UserModel.UserWithoutPassword,
	) {
		const filteredBody =
			user.role === "admin"
				? body
				: {
						status: body.status,
					};
		const job = (
			await db
				.update(jobTable)
				.set(filteredBody)
				.where(userJobAccessCondition(user.id, body.id))
				.returning()
		).pop();

		if (!job) {
			return AppError.Unauthorized;
		}
		if (job.assignedTo) {
			sendUserMessage(
				user.id === job.assignedTo ? job.createdBy : job.assignedTo,
				RealtimeModel.RealtimeMessageType.JobUpdated,
				job,
			);
		}
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
		if (query.status === "none") {
			query.status = undefined;
		}
		const jobs = await db
			.select()
			.from(jobTable)
			.where(
				and(
					or(eq(jobTable.assignedTo, id), eq(jobTable.createdBy, id)),
					query.start ? gte(jobTable.startDate, query.start) : undefined,
					query.end ? lt(jobTable.endDate, query.end) : undefined,
					query.status ? eq(jobTable.status, query.status) : undefined,
				),
			);
		return jobs;
	}

	static async fetchJobDocuments(jobId: number, userId: number) {
		const documents = await db
			.select({
				id: fileTable.id,
				fileName: fileTable.fileName,
			})
			.from(jobFiles)
			.innerJoin(fileTable, eq(fileTable.id, jobFiles.fileId))
			.innerJoin(jobTable, eq(jobTable.id, jobFiles.jobId))
			.where(userJobAccessCondition(userId, jobId));

		return documents;
	}

	static async createJobDocument(jobId: number, file: File, userId: number) {
		const job = await db
			.select({})
			.from(jobTable)
			.where(userJobAccessCondition(userId, jobId))
			.limit(1);

		if (job.length <= 0) {
			return AppError.Unauthorized;
		}
		const fileId = await FileStorageService.uploadFile(file);

		await db.insert(jobFiles).values({
			fileId,
			jobId,
		});

		return {
			id: fileId,
			fileName: file.name,
		};
	}

	static async deleteJobDocument(
		jobId: number,
		userId: number,
		fileId: string,
	) {
		const userJob = db
			.$with("user_job")
			.as(
				db
					.select()
					.from(jobFiles)
					.innerJoin(jobTable, eq(jobTable.id, jobFiles.jobId))
					.where(userJobAccessCondition(userId, jobId)),
			);

		await db.with(userJob).delete(jobFiles).where(eq(jobFiles.fileId, fileId));
		await FileStorageService.deleteFile(fileId);
	}

	static async getJobTasks(jobId: number, userId: number) {
		const tasks = await db
			.select({
				id: jobTaskTable.id,
				title: jobTaskTable.title,
				completed: jobTaskTable.completed,
				jobId: jobTaskTable.jobId,
			})
			.from(jobTaskTable)
			.leftJoin(jobTable, eq(jobTable.id, jobTaskTable.jobId))
			.where(
				and(
					eq(jobTaskTable.jobId, jobId),
					or(eq(jobTable.assignedTo, userId), eq(jobTable.createdBy, userId)),
				),
			);

		return status(200, tasks);
	}

	static async createJobTask(
		jobId: number,
		body: JobModel.JobTaskCreateBody,
		userId: number,
	) {
		const task = (
			await db
				.with(withUserJob(userId, jobId))
				.insert(jobTaskTable)
				.values({
					jobId,
					title: body.title,
					completed: body.completed,
				})
				.returning()
		).pop();

		if (!task) {
			return AppError.Unauthorized;
		}

		return status(200, task);
	}

	static async updateJobTask(
		jobId: number,
		body: JobModel.JobTaskUpdateBody,
		userId: number,
	) {
		const task = await db
			.with(withUserJob(userId, jobId))
			.update(jobTaskTable)
			.set({
				title: body.title,
				completed: body.completed,
			})
			.where(eq(jobTaskTable.id, body.id))
			.returning();

		return status(200, task);
	}
	static async deleteJobTask(jobId: number, taskId: number, userId: number) {
		const task = await db
			.with(withUserJob(userId, jobId))
			.delete(jobTaskTable)
			.where(eq(jobTaskTable.id, taskId))
			.returning();

		if (task.length === 0) {
			return AppError.NotFound;
		}

		return status(200, null);
	}
}
