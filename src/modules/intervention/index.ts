import Elysia from "elysia";
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
      detail: {
        summary: "Create Intervention",
        description: "Create a new intervention with the provided details.",
      },
    }
  )
  .get(
    "/",
    async ({ user }) => await InterventionService.fetchIntervention(user),
    {
      user: true,
      detail: {
        summary: "Get Interventions",
        description: "Retrieve a list of interventions.",
      },
      response: {
        200: InterventionModel.InterventionList,
      },
    }
  )
  .patch("/", ({ body }) => InterventionService.updateIntervention(body), {
    role: "admin",
    body: InterventionModel.InterventionUpdateBody,
  });
