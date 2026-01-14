import { status, t } from "elysia";
import {
	type jobReportTable,
	jobTable,
	type jobTaskTable,
} from "../../services/db/schema";

export namespace JobModel {
	export type Job = typeof Job.static;
	export type JobSelectQuery = typeof JobSelectQuery.static;
	export type JobList = typeof JobList.static;
	export type JobCreateBody = typeof JobCreateBody.static;
	export type JobUpdateBody = typeof JobUpdateBody.static;
	export type JobTaskCreateBody = typeof JobTaskCreateBody.static;
	export type JobTaskUpdateBody = typeof JobTaskUpdateBody.static;
	export type JobTask = typeof jobTaskTable.$inferSelect;
	export type JobReport = typeof jobReportTable.$inferSelect;
	export type JobReportCreateBody = typeof JobReportCreateBody.static;
	export type JobReportUpdateBody = typeof JobReportUpdateBody.static;

	export const JobStatusString = t.String();
	export const JobStatusEnum = t.UnionEnum(
		["scheduled", "pending", "inProgress", "completed"],
		{
			description: "Job status filter",
		},
	);

	export type JobStatusString =
		| "scheduled"
		| "pending"
		| "inProgress"
		| "completed";

	export const Job = t.Object({
		id: t.Integer(),
		title: t.String(),
		chatId: t.Nullable(t.Number()),
		description: t.String(),
		assignedClient: t.Nullable(t.Integer()),
		broadcast: t.Boolean(),
		startDate: t.String(),
		endDate: t.String(),
		location: t.String(),
		status: JobStatusEnum,
		createdAt: t.String(),
		updatedAt: t.String(),
	});

	export const JobSelectFields = {
		id: jobTable.id,
		description: jobTable.description,
		title: jobTable.title,
		startDate: jobTable.startDate,
		endDate: jobTable.endDate,
		status: jobTable.status,
		assignedClient: jobTable.assignedClient,
		createdBy: jobTable.createdBy,
		broadcast: jobTable.broadcast,
		createdAt: jobTable.createdAt,
		updatedAt: jobTable.updatedAt,
		chatId: jobTable.chatId,
		location: jobTable.location,
	};

	export const JobSelectQuery = t.Partial(
		t.Object({
			start: t.String(),
			end: t.String(),
			status: t.Optional(
				t.UnionEnum(["scheduled", "pending", "inProgress", "completed"], {
					description: "Filter jobs by status",
					default: undefined,
				}),
			),
			notStatus: t.Optional(
				t.UnionEnum(["scheduled", "pending", "inProgress", "completed"], {
					description: "Exclude jobs with this status",
					default: undefined,
				}),
			),
			operatorId: t.Integer({
				description: "Filter jobs by operator/assignee ID",
			}),
			broadcast: t.Optional(
				t.Boolean({ description: "Filter by broadcast status" }),
			),
		}),
	);

	export const JobCreateBody = t.Object({
		title: t.String({
			minLength: 1,
			error: () => status(422, "Title must be at least 3 characters long"),
		}),
		chatId: t.Optional(t.Optional(t.Integer())),
		description: t.Optional(t.String()),
		operatorIds: t.Array(t.Integer(), {
			description: "Array of operator IDs to assign to this job",
		}),
		assignedClient: t.Optional(t.Integer()),
		broadcast: t.Optional(t.Boolean()),
		startDate: t.Optional(t.String()),
		endDate: t.Optional(t.String()),
		location: t.Optional(t.String()),
		status: t.Optional(
			t.UnionEnum(["scheduled", "pending", "inProgress", "completed"]),
		),
	});

	export const JobUpdateBody = t.Object({
		id: t.Integer(),
		title: t.Optional(t.String({ minLength: 1 })),
		description: t.Optional(t.String()),
		assignedClient: t.Optional(t.Nullable(t.Integer())),
		broadcast: t.Optional(t.Boolean()),
		startDate: t.Optional(t.String()),
		endDate: t.Optional(t.String()),
		location: t.Optional(t.String()),
		status: t.Optional(
			t.UnionEnum(["scheduled", "pending", "inProgress", "completed"]),
		),
	});

	export const JobTaskCreateBody = t.Object({
		title: t.String({ minLength: 1 }),

		completed: t.Optional(t.Boolean()),
		jobId: t.Integer(),
	});

	export const JobTaskUpdateBody = t.Object({
		id: t.Integer(),
		jobId: t.Integer(),
		title: t.Optional(t.String({ minLength: 1 })),
		completed: t.Optional(t.Boolean()),
	});

	export const JobList = t.Array(Job);

	export const JobReport = t.Object({
		id: t.Integer(),
		description: t.String(),
		jobId: t.Integer(),
		signature: t.String(),
		completedAt: t.String(),
	});

	export const JobReportCreateBody = t.Object({
		jobId: t.Integer(),
		signature: t.File({
			description: "Signature file for the job report",
		}),
		description: t.Optional(t.String()),
		files: t.Optional(
			t.Array(t.File(), {
				description: "Additional files to attach to the report",
			}),
		),
	});

	export const JobReportUpdateBody = t.Object({
		id: t.Integer(),
		description: t.Optional(t.String()),
		files: t.Optional(
			t.Array(t.File(), {
				description: "Additional files to attach to the report",
			}),
		),
	});

	export const JobOperatorAssignment = t.Object({
		id: t.Integer(),
		jobId: t.Integer(),
		operatorId: t.Integer(),
		assignedAt: t.String(),
	});

	export type JobOperatorAssignment = typeof JobOperatorAssignment.static;

	export const JobOperatorUpdateBody = t.Object({
		jobId: t.Integer(),
		operatorIds: t.Array(t.Integer(), {
			description: "Array of operator IDs to assign to this job",
		}),
	});

	export type JobOperatorUpdateBody = typeof JobOperatorUpdateBody.static;
}
