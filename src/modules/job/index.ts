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
  .get("/:id", ({ params: { id } }) => JobService.getJobById(id), {
    user: true,
    params: t.Object({
      id: t.Number({ description: "ID of the Job to retrieve" }),
    }),
    detail: {
      summary: "Get Job by ID",
      description: "Retrieve a specific Job by its ID.",
    },
  })
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
    }
  )
  .patch("/", ({ body }) => JobService.updateJob(body), {
    role: "admin",
    body: JobModel.JobUpdateBody,
  });
