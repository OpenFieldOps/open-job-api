import Elysia, { t } from "elysia";
import { authMacroPlugin, roleMacroPlugin } from "../auth/macro";
import { InterventionModel } from "./model";
import { InterventionService } from "./service";

export const interventionPlugin = new Elysia({
  name: "intervention",
  prefix: "/intervention",
  tags: ["intervention"],
  detail: {
    summary: "Intervention Module",
    description:
      "Handles intervention-related operations such as creating and managing interventions.",
  },
})
  .use(authMacroPlugin)
  .use(roleMacroPlugin)
  .post(
    "/",
    ({ body, user }) => InterventionService.createIntervention(body, user.id),
    {
      body: InterventionModel.InterventionCreateBody,
      role: "admin",
      response: {
        401: t.String(),
      },
      detail: {
        summary: "Create Intervention",
        description: "Create a new intervention with the provided details.",
      },
    }
  )
  .get(
    "/",
    async ({ user, query }) =>
      await InterventionService.fetchIntervention(user, query),
    {
      user: true,
      query: InterventionModel.InterventionSelectQuery,
      detail: {
        summary: "Get Interventions",
        description: "Retrieve a list of interventions.",
      },
    }
  )
  .get(
    "/:id",
    ({ params: { id } }) => InterventionService.getInterventionById(id),
    {
      user: true,
      params: t.Object({
        id: t.Number({ description: "ID of the intervention to retrieve" }),
      }),
      detail: {
        summary: "Get Intervention by ID",
        description: "Retrieve a specific intervention by its ID.",
      },
    }
  )
  .delete(
    "/:id",
    ({ params: { id }, user }) =>
      InterventionService.deleteIntervention(id, user.id),
    {
      params: t.Object({
        id: t.Number({ description: "ID of the intervention to delete" }),
      }),
      role: "admin",
      detail: {
        summary: "Delete Intervention",
        description: "Delete an intervention by its ID.",
      },
    }
  )
  .patch("/", ({ body }) => InterventionService.updateIntervention(body), {
    role: "admin",
    body: InterventionModel.InterventionUpdateBody,
  });
