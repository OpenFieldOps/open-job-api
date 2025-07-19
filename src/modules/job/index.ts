import Elysia, { t } from "elysia";
import { authMacroPlugin, roleMacroPlugin } from "../auth/macro";
import { JobModel } from "./model";
import { JobService } from "./service";

export const jobPlugin = new Elysia({
	name: "job",
	prefix: "/job",
	tags: ["job"],
	detail: {
		summary: "Job Module",
		description:
			"Handles Job-related operations such as creating and managing Jobs.",
	},
})
	.use(authMacroPlugin)
	.use(roleMacroPlugin)
	.post("/", ({ body, user }) => JobService.createJob(body, user.id), {
		body: JobModel.JobCreateBody,
		role: "admin",
		response: {
			401: t.String(),
			422: t.String(),
		},
		detail: {
			summary: "Create Job",
			description: "Create a new Job with the provided details.",
		},
	})
	.get("/", async ({ user, query }) => await JobService.fetchJob(user, query), {
		user: true,
		query: JobModel.JobSelectQuery,
		detail: {
			summary: "Get Jobs",
			description: "Retrieve a list of Jobs.",
		},
	})
	.get(
		"/:id",
		({ params: { id }, user }) => JobService.getJobById(id, user.id),
		{
			user: true,
			params: t.Object({
				id: t.Number({ description: "ID of the Job to retrieve" }),
			}),
			detail: {
				summary: "Get Job by ID",
				description: "Retrieve a specific Job by its ID.",
			},
		},
	)
	.get(
		"/documents/:jobId",
		async ({ user, params: { jobId } }) =>
			await JobService.fetchJobDocuments(jobId, user.id),
		{
			user: true,
			params: t.Object({
				jobId: t.Number(),
			}),
		},
	)
	.post(
		"/documents/:jobId",
		async ({ user, body, params: { jobId } }) =>
			JobService.createJobDocument(jobId, body.file, user.id),
		{
			user: true,
			params: t.Object({
				jobId: t.Number(),
			}),
			body: t.Object({
				file: t.File(),
			}),
			detail: {
				summary: "Create Job Document",
				description: "Create a new document for a specific Job.",
			},
		},
	)
	.delete(
		"/delete-document",
		async ({ user, body: { jobId, fileId } }) =>
			JobService.deleteJobDocument(jobId, user.id, fileId),
		{
			role: "admin",
			body: t.Object({
				jobId: t.Number(),
				fileId: t.String(),
			}),
			detail: {
				summary: "Create Job Document",
				description: "Create a new document for a specific Job.",
			},
		},
	)
	.delete(
		"/:id",
		({ params: { id }, user }) => JobService.deleteJob(id, user.id),
		{
			params: t.Object({
				id: t.Number({ description: "ID of the Job to delete" }),
			}),
			role: "admin",
			detail: {
				summary: "Delete Job",
				description: "Delete an Job by its ID.",
			},
		},
	)
	.patch("/", ({ body, user }) => JobService.updateJob(body, user), {
		user: true,
		body: JobModel.JobUpdateBody,
	});
