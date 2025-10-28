import { describe, expect, it } from "bun:test";
import { createDummyData, createSecondaryDummyData } from "../../scripts/dummy";
import { api } from "./setup";
import { userHeader } from "./utils";

const defaultPricingModelData = {
  name: "Test Pricing Model",
  baseRate: 100,
  ranges: [
    { hours: 1, rate: 50, position: 1 },
    { hours: 2, rate: 90, position: 2 },
  ],
};

describe("Pricing Model Tests", () => {
  it("should create a pricing model", async () => {
    const dummy = await createDummyData();
    const pricing_res = await api["pricing-model"].post(
      defaultPricingModelData,
      userHeader(dummy.admin.token)
    );

    expect(pricing_res.status).toBe(200);
    expect(pricing_res.data).toHaveProperty("id");
    expect(pricing_res.data?.name).toBe(defaultPricingModelData.name);
  });

  it("should fetch pricing models", async () => {
    const dummy = await createDummyData();
    await api["pricing-model"].post(
      defaultPricingModelData,
      userHeader(dummy.admin.token)
    );

    const pricing_res = await api["pricing-model"].get({
      ...userHeader(dummy.admin.token),
    });

    if (!pricing_res.data) {
      throw new Error("No data returned");
    }

    expect(pricing_res.status).toBe(200);
    expect(pricing_res.data).toBeArray();
    expect(pricing_res.data).toHaveLength(1);
    expect(pricing_res.data).not.toBeNull();
    expect(pricing_res.data[0].name).toBe(defaultPricingModelData.name);
  });

  it("should update a pricing model", async () => {
    const dummy = await createDummyData();

    const createRes = await api["pricing-model"].post(
      defaultPricingModelData,
      userHeader(dummy.admin.token)
    );

    expect(createRes.status).toBe(200);
    expect(createRes.data).not.toBeNull();

    if (!createRes.data) {
      throw new Error("No data returned");
    }

    const pricingModelId = createRes.data.id;

    const updatedData = {
      id: pricingModelId,
      name: "Updated Pricing Model",
      baseRate: 150,
      ranges: [
        {
          hours: 1,
          rate: 60,
          position: 1,
        },
        {
          hours: 3,
          rate: 120,
          position: 2,
        },
      ],
    };

    const updateRes = await api["pricing-model"]({
      id: pricingModelId,
    }).patch(updatedData, userHeader(dummy.admin.token));

    expect(updateRes.status).toBe(200);
    expect(updateRes.data?.name).toBe(updatedData.name);
    expect(updateRes.data?.baseRate).toBe(updatedData.baseRate);
  });

  it("should delete a pricing model", async () => {
    const dummy = await createDummyData();

    const createRes = await api["pricing-model"].post(
      defaultPricingModelData,
      userHeader(dummy.admin.token)
    );

    expect(createRes.status).toBe(200);
    expect(createRes.data).not.toBeNull();
    const pricingModelId = createRes.data?.id;

    const deleteRes = await api["pricing-model"]({
      id: pricingModelId as number,
    }).delete({ id: pricingModelId }, userHeader(dummy.admin.token));

    expect(deleteRes.status).toBe(200);

    const fetchRes = await api["pricing-model"].get({
      ...userHeader(dummy.admin.token),
    });

    expect(fetchRes.status).toBe(200);
    expect(fetchRes.data).toBeArray();
    expect(fetchRes.data).toHaveLength(0);
  });

  it("should set a pricing model to a user", async () => {
    const dummy = await createDummyData();

    const createRes = await api["pricing-model"].post(
      defaultPricingModelData,
      userHeader(dummy.admin.token)
    );

    expect(createRes.status).toBe(200);
    expect(createRes.data).not.toBeNull();
    const pricingModelId = createRes.data?.id;

    const setRes = await api["pricing-model"]
      .assign({
        userId: dummy.operator.user.id,
      })
      .put(
        { pricingModelId: pricingModelId as number },
        userHeader(dummy.admin.token)
      );

    expect(setRes.status).toBe(200);
    expect(setRes.data).not.toBeNull();
    expect(setRes.data?.pricingModel).toBe(pricingModelId);
  });

  it("should not allow setting a pricing model that doesn't belong to the admin", async () => {
    const dummy = await createDummyData();
    const dummy2 = await createSecondaryDummyData();

    const createRes = await api["pricing-model"].post(
      defaultPricingModelData,
      userHeader(dummy.admin.token)
    );

    expect(createRes.status).toBe(200);
    expect(createRes.data).not.toBeNull();
    const pricingModelId = createRes.data?.id;

    const setRes = await api["pricing-model"]
      .assign({
        userId: dummy2.operator.user.id,
      })
      .put(
        { pricingModelId: pricingModelId as number },
        userHeader(dummy2.admin.token)
      );

    expect(setRes.status).toBe(404);
  });

  it("should not allow setting a pricing model to a non-existent user", async () => {
    const dummy = await createDummyData();

    const createRes = await api["pricing-model"].post(
      defaultPricingModelData,
      userHeader(dummy.admin.token)
    );

    expect(createRes.status).toBe(200);
    expect(createRes.data).not.toBeNull();
    const pricingModelId = createRes.data?.id;

    const setRes = await api["pricing-model"]
      .assign({
        userId: 99999,
      })
      .put(
        { pricingModelId: pricingModelId as number },
        userHeader(dummy.admin.token)
      );

    expect(setRes.status).toBe(404);
  });
});
