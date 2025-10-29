import Elysia, { t } from "elysia";
import { paramsWithId } from "../../utils/validation";
import { authMacroPlugin, roleMacroPlugin } from "../auth/macro";
import { JobModel } from "./JobModel";
import { JobDocumentService } from "./services/JobDocumentService";
import { JobReportService } from "./services/JobReportService";
import { JobService } from "./services/JobService";
import { JobTaskService } from "./services/JobTaskService";

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
      params: paramsWithId(),
      detail: {
        summary: "Get Job by ID",
        description: "Retrieve a specific Job by its ID.",
      },
    }
  )
  .delete(
    "/:id",
    ({ params: { id }, user }) => JobService.deleteJob(id, user.id),
    {
      params: paramsWithId(),
      role: "admin",
      detail: {
        summary: "Delete Job",
        description: "Delete an Job by its ID.",
      },
    }
  )
  .patch("/", ({ body, user }) => JobService.updateJob(body, user), {
    user: true,
    body: JobModel.JobUpdateBody,
  })
  .get(
    "/documents/:jobId",
    async ({ user, params: { jobId } }) =>
      await JobDocumentService.fetchJobDocuments(jobId, user.id),
    {
      user: true,
      params: paramsWithId("jobId"),
    }
  )
  .post(
    "/documents/:jobId",
    async ({ user, body, params: { jobId } }) =>
      JobDocumentService.createJobDocument(jobId, body.file, user.id),
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
    }
  )
  .delete(
    "/delete-document",
    async ({ user, body: { jobId, fileId } }) =>
      JobDocumentService.deleteJobDocument(jobId, user.id, fileId),
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
    }
  )
  .get(
    "/task/:jobId",
    async ({ params: { jobId }, user }) =>
      JobTaskService.getJobTasks(jobId, user.id),
    {
      user: true,
      params: t.Object({
        jobId: t.Number(),
      }),
      detail: {
        summary: "Get Job Tasks",
        description: "Retrieve all Tasks for a specific Job.",
      },
    }
  )

  .post(
    "/task",
    async ({ body, user }) =>
      JobTaskService.createJobTask(body.jobId, body, user.id),
    {
      user: true,
      body: JobModel.JobTaskCreateBody,
      detail: {
        summary: "Create Job Task",
        description: "Create a new Task for a specific Job.",
      },
    }
  )
  .patch(
    "/task",
    async ({ body, user }) =>
      JobTaskService.updateJobTask(body.id, body, user.id),
    {
      user: true,
      body: JobModel.JobTaskUpdateBody,
      detail: {
        summary: "Update Job Task",
        description: "Update an existing Task for a specific Job.",
      },
    }
  )
  .delete(
    "/delete-task",
    async ({ body: { jobId, taskId }, user }) =>
      JobTaskService.deleteJobTask(jobId, taskId, user.id),
    {
      user: true,
      body: t.Object({
        jobId: t.Number(),
        taskId: t.Number(),
      }),
      detail: {
        summary: "Delete Job Task",
        description: "Delete a specific Task from a Job.",
      },
    }
  )
  .post(
    "/report",
    async ({ body, user }) => JobReportService.createJobReport(body, user.id),
    {
      user: true,
      body: JobModel.JobReportCreateBody,
      detail: {
        summary: "Create Job Report",
        description:
          "Create a new report for a completed job with signature and optional files.",
      },
    }
  )
  .get(
    "/report/:jobId",
    async ({ params: { jobId }, user }) =>
      JobReportService.getJobReports(jobId, user.id),
    {
      user: true,
      params: paramsWithId("jobId"),
      detail: {
        summary: "Get Job Reports",
        description: "Retrieve all reports for a specific job.",
      },
    }
  )
  .get(
    "/report/detail/:reportId",
    async ({ params: { reportId }, user }) =>
      JobReportService.getJobReportById(reportId, user.id),
    {
      user: true,
      params: paramsWithId("reportId"),
      detail: {
        summary: "Get Job Report by ID",
        description: "Retrieve a specific job report by its ID.",
      },
    }
  )
  .patch(
    "/report/:reportId",
    async ({ params: { reportId }, body, user }) =>
      JobReportService.updateJobReport(reportId, body, user.id),
    {
      user: true,
      params: paramsWithId("reportId"),
      body: JobModel.JobReportUpdateBody,
      detail: {
        summary: "Update Job Report",
        description: "Update an existing job report.",
      },
    }
  )
  .delete(
    "/report/:reportId",
    async ({ params: { reportId }, user }) =>
      JobReportService.deleteJobReport(reportId, user.id),
    {
      user: true,
      params: paramsWithId("reportId"),
      detail: {
        summary: "Delete Job Report",
        description: "Delete a job report and all its associated files.",
      },
    }
  )
  .get(
    "/report/files/:reportId",
    async ({ params: { reportId }, user }) =>
      JobReportService.getJobReportFiles(reportId, user.id),
    {
      user: true,
      params: paramsWithId("reportId"),
      detail: {
        summary: "Get Job Report Files",
        description: "Retrieve all files associated with a job report.",
      },
    }
  );
