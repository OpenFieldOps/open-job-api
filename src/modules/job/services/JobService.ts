import { and, eq, gte, inArray, lt, not, or } from "drizzle-orm";
import { ElysiaCustomStatusResponse, status } from "elysia";
import { db } from "../../../services/db/db";
import {
	jobOperatorTable,
	jobTable,
	userAdminTable,
} from "../../../services/db/schema";
import { AppError } from "../../../utils/error";
import { ChatService } from "../../chat/ChatService";
import { UserNotificationModel } from "../../notification/NotificationModel";
import { UserNotificationService } from "../../notification/NotificationService";
import type { UserModel } from "../../user/UserModel";
import { UserService } from "../../user/UserService";
import { JobModel } from "../JobModel";
import { userJobAccessSubquery } from "./JobAccess";
import { JobOperatorService } from "./JobOperatorService";

export abstract class JobService {
	static async createJob(body: JobModel.JobCreateBody, userId: number) {
		if (body.operatorIds.length > 0) {
			const managedUsers = await db
				.select({ id: userAdminTable.id })
				.from(userAdminTable)
				.where(
					and(
						eq(userAdminTable.adminId, userId),
						inArray(userAdminTable.userId, body.operatorIds),
					),
				);

			if (managedUsers.length !== body.operatorIds.length) {
				return AppError.Unauthorized;
			}
		}

		const uniqueUserIds = Array.from(new Set([userId, ...body.operatorIds]));
		const chat = await ChatService.createChat(
			`Job - ${body.title}`,
			uniqueUserIds,
		);

		const job = await db.transaction(async (tx) => {
			const [createdJob] = await tx
				.insert(jobTable)
				.values({
					title: body.title,
					description: body.description,
					startDate: body.startDate,
					endDate: body.endDate,
					assignedClient: body.assignedClient,
					status: body.status || "scheduled",
					createdBy: userId,
					chatId: chat.id,
				})
				.returning();

			if (body.operatorIds.length > 0) {
				await tx.insert(jobOperatorTable).values(
					body.operatorIds.map((operatorId) => ({
						jobId: createdJob.id,
						operatorId,
						assignedAt: new Date().toISOString(),
					})),
				);
			}

			return createdJob;
		});

		return {
			job,
			chat,
		};
	}

	static async fetchJob(
		{ id }: UserModel.UserIdAndRole,
		query: JobModel.JobSelectQuery,
	): Promise<JobModel.JobList> {
		const targetUserId = query.operatorId || id;

		const jobs: JobModel.Job[] = await db
			.selectDistinct(JobModel.JobSelectFields)
			.from(jobTable)
			.leftJoin(jobOperatorTable, eq(jobOperatorTable.jobId, jobTable.id))
			.where(
				and(
					or(
						eq(jobTable.createdBy, targetUserId),
						eq(jobOperatorTable.operatorId, targetUserId),
						eq(jobTable.broadcast, true),
					),
					query.start ? gte(jobTable.startDate, query.start) : undefined,
					query.end ? lt(jobTable.endDate, query.end) : undefined,
					query.status ? eq(jobTable.status, query.status) : undefined,
					query.notStatus
						? not(eq(jobTable.status, query.notStatus))
						: undefined,
					query.broadcast !== undefined
						? eq(jobTable.broadcast, query.broadcast)
						: undefined,
				),
			);

		return jobs;
	}

	static async updateJob(
		body: JobModel.JobUpdateBody,
		user: UserModel.UserWithoutPassword,
	) {
		const filteredBody =
			user.role === "admin"
				? body
				: { status: body.status, broadcast: body.broadcast };

		const job = await db
			.update(jobTable)
			.set(filteredBody)
			.where(
				and(
					eq(jobTable.id, body.id),
					inArray(jobTable.id, userJobAccessSubquery(body.id, user.id)),
				),
			)
			.returning();

		if (job.length === 0) return AppError.Unauthorized;

		if (job[0].createdBy !== user.id && body.status === "completed") {
			UserNotificationService.sendNotification(job[0].createdBy, {
				title: "Job Completed",
				message: `Job "${job[0].title}" has been completed by ${user.firstName} ${user.lastName}.`,
				type: UserNotificationModel.UserNotificationType.JobCompleted,
				payload: {
					jobId: job[0].id,
				} as UserNotificationModel.UserNotificationInterventionPayload,
			});
		}
	}

	static async applyJob(user: UserModel.UserWithoutPassword, jobId: number) {
		const isBroadcasted = await db
			.select({ broadcast: jobTable.broadcast })
			.from(jobTable)
			.where(eq(jobTable.id, jobId))
			.limit(1);

		if (isBroadcasted.length === 0) {
			return AppError.NotFound;
		}

		if (!isBroadcasted[0].broadcast) {
			return AppError.Unauthorized;
		}

		const adminResult = await UserService.getAdminOfUser(user.id);

		if (adminResult instanceof ElysiaCustomStatusResponse) {
			return adminResult;
		}

		await JobOperatorService.assignOperatorsToJob(
			jobId,
			[user.id],
			adminResult,
		);
		await UserNotificationService.sendNotification(adminResult, {
			title: "Job Application Received",
			message: `${user.firstName} ${user.lastName} has applied for a broadcasted job.`,
			type: UserNotificationModel.UserNotificationType.JobUpdated,
			payload: {
				jobId: jobId,
			},
		});
		return await JobService.updateJob({ id: jobId, broadcast: false }, user);
	}

	static async deleteJob(jobId: number, userId: number) {
		const deleted = await db
			.delete(jobTable)
			.where(
				and(
					eq(jobTable.id, jobId),
					inArray(jobTable.id, userJobAccessSubquery(jobId, userId)),
				),
			)
			.returning();

		if (deleted.length === 0) return AppError.NotFound;
		return status(200, null);
	}

	static async getJobById(id: number, userId: number) {
		const job = await db
			.select()
			.from(jobTable)
			.where(
				and(
					eq(jobTable.id, id),
					inArray(jobTable.id, userJobAccessSubquery(id, userId)),
				),
			)
			.limit(1);

		if (job.length === 0) return AppError.NotFound;
		return job[0];
	}
}
