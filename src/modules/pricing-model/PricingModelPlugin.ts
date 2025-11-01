import Elysia, { t } from "elysia";
import { roleMacroPlugin } from "../auth/macro";
import { PricingModel } from "./PricingModelModel";
import { PricingModelService } from "./PricingModelService";

export const pricingModelPlugin = new Elysia({
  name: "pricing-model",
  prefix: "/pricing-model",
  tags: ["pricing-model"],
})
  .use(roleMacroPlugin)
  .post(
    "/",
    async ({ body, user }) => {
      return await PricingModelService.createPricingModel(user.id, body);
    },
    {
      role: "admin",
      body: PricingModel.PricingModelCreate,
      detail: {
        summary: "Create Pricing Model",
        description: "Create a new Pricing Model for the authenticated user.",
      },
    }
  )
  .get(
    "/",
    async ({ user }) => {
      return await PricingModelService.getPricingModelsByUser(user.id);
    },
    {
      role: "admin",
      detail: {
        summary: "Get Pricing Models",
        description: "Retrieve all Pricing Models for the authenticated user.",
      },
    }
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, user }) => {
      return await PricingModelService.updatePricingModel(
        user.id,
        Number(id),
        body
      );
    },
    {
      role: "admin",
      params: t.Object({
        id: t.Number(),
      }),
      body: PricingModel.PricingModelUpdate,
      detail: {
        summary: "Update Pricing Model",
        description:
          "Update an existing Pricing Model for the authenticated user.",
      },
    }
  )
  .put(
    "/assign/:userId",
    async ({ params: { userId }, body, user }) => {
      return await PricingModelService.setUserPricingModel(
        user.id,
        userId,
        body.pricingModelId
      );
    },
    {
      role: "admin",
      params: t.Object({
        userId: t.Number(),
      }),
      body: t.Object({
        pricingModelId: t.Nullable(t.Number()),
      }),
      detail: {
        summary: "Assign Pricing Model to User",
        description:
          "Assign a pricing model to a specific user. The pricing model must belong to the authenticated admin.",
      },
    }
  )
  .delete(
    "/:id",
    async ({ params: { id }, user }) => {
      return await PricingModelService.deletePricingModel(user.id, Number(id));
    },
    {
      role: "admin",
      params: t.Object({
        id: t.Number(),
      }),
      detail: {
        summary: "Delete Pricing Model",
        description:
          "Delete an existing Pricing Model for the authenticated user.",
      },
    }
  );
