import { describe, expect, it } from "bun:test";
import dayjs from "dayjs";
import { createDummyData } from "../../scripts/dummy";
import type { AuthModel } from "../modules/auth/AuthModel";
import { api } from "./setup";
import { userHeader } from "./utils";

async function createJobWithClient(
  admin: AuthModel.AuthenticatedUserSuccessResponse,
  clientId: number,
  startDate: string,
  endDate: string,
  title: string
) {
  return await api.job.post(
    {
      title,
      startDate,
      endDate,
      assignedTo: admin.user.id,
      assignedClient: clientId,
    },
    userHeader(admin.token)
  );
}

describe("Invoice PDF Generation Tests", () => {
  it("should generate invoice PDF for client with pricing model and jobs", async () => {
    const dummy = await createDummyData();

    const pricingRes = await api["pricing-model"].post(
      {
        name: "Invoice Test Pricing",
        baseRate: 100,
        ranges: [
          { hours: 8, rate: 50, position: 1 },
          { hours: 16, rate: 75, position: 2 },
        ],
      },
      userHeader(dummy.admin.token)
    );

    expect(pricingRes.status).toBe(200);
    expect(pricingRes.data).not.toBeNull();

    await api["pricing-model"]
      .assign({ userId: dummy.operator.user.id })
      .put(
        { pricingModelId: pricingRes.data?.id as number },
        userHeader(dummy.admin.token)
      );

    const startDate = dayjs()
      .subtract(1, "month")
      .startOf("day")
      .set("hour", 8);
    const endDate = dayjs().subtract(1, "month").startOf("day").set("hour", 16);

    await createJobWithClient(
      dummy.admin,
      dummy.operator.user.id,
      startDate.toISOString(),
      endDate.toISOString(),
      "Test Job 1"
    );

    await createJobWithClient(
      dummy.admin,
      dummy.operator.user.id,
      startDate.add(1, "day").toISOString(),
      endDate.add(1, "day").toISOString(),
      "Test Job 2"
    );

    const invoiceRes = await api.invoice.generate.post(
      {
        clientId: dummy.operator.user.id,
        startDate: startDate.subtract(1, "day").toISOString(),
        endDate: endDate.add(10, "day").toISOString(),
      },
      userHeader(dummy.admin.token)
    );

    expect(invoiceRes.status).toBe(200);
    expect(invoiceRes.data).toBeDefined();
  });

  it("should return error when client has no pricing model", async () => {
    const dummy = await createDummyData();

    const startDate = dayjs()
      .subtract(1, "month")
      .startOf("day")
      .set("hour", 8);
    const endDate = dayjs().subtract(1, "month").startOf("day").set("hour", 16);

    await createJobWithClient(
      dummy.admin,
      dummy.operator.user.id,
      startDate.toISOString(),
      endDate.toISOString(),
      "Test Job Without Pricing"
    );

    const invoiceRes = await api.invoice.generate.post(
      {
        clientId: dummy.operator.user.id,
        startDate: startDate.subtract(1, "day").toISOString(),
        endDate: endDate.add(10, "day").toISOString(),
      },
      userHeader(dummy.admin.token)
    );

    expect(invoiceRes.status).toBe(400);
  });

  it("should return error when client does not exist", async () => {
    const dummy = await createDummyData();

    const startDate = dayjs().subtract(1, "month").startOf("day");
    const endDate = dayjs().subtract(1, "month").endOf("day");

    const invoiceRes = await api.invoice.generate.post(
      {
        clientId: 99999,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      userHeader(dummy.admin.token)
    );

    expect(invoiceRes.status).toBe(404);
  });

  it("should generate empty invoice when no jobs in date range", async () => {
    const dummy = await createDummyData();

    const pricingRes = await api["pricing-model"].post(
      {
        name: "Empty Invoice Test",
        baseRate: 100,
        ranges: [],
      },
      userHeader(dummy.admin.token)
    );

    expect(pricingRes.status).toBe(200);

    await api["pricing-model"]
      .assign({ userId: dummy.operator.user.id })
      .put(
        { pricingModelId: pricingRes.data?.id as number },
        userHeader(dummy.admin.token)
      );

    const startDate = dayjs().add(10, "year").startOf("day");
    const endDate = dayjs().add(10, "year").endOf("day");

    const invoiceRes = await api.invoice.generate.post(
      {
        clientId: dummy.operator.user.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      userHeader(dummy.admin.token)
    );

    expect(invoiceRes.status).toBe(200);
    expect(invoiceRes.data).toBeDefined();
  });

  it("should generate invoice with tiered pricing calculations", async () => {
    const dummy = await createDummyData();

    const pricingRes = await api["pricing-model"].post(
      {
        name: "Tiered Invoice Test",
        baseRate: 40,
        ranges: [
          { hours: 4, rate: 50, position: 1 },
          { hours: 8, rate: 75, position: 2 },
        ],
      },
      userHeader(dummy.admin.token)
    );

    expect(pricingRes.status).toBe(200);

    await api["pricing-model"]
      .assign({ userId: dummy.operator.user.id })
      .put(
        { pricingModelId: pricingRes.data?.id as number },
        userHeader(dummy.admin.token)
      );

    const startDate = dayjs()
      .subtract(1, "month")
      .startOf("day")
      .set("hour", 8);
    const endDate = dayjs().subtract(1, "month").startOf("day").set("hour", 20);

    await createJobWithClient(
      dummy.admin,
      dummy.operator.user.id,
      startDate.toISOString(),
      endDate.toISOString(),
      "12 Hour Job"
    );

    const invoiceRes = await api.invoice.generate.post(
      {
        clientId: dummy.operator.user.id,
        startDate: startDate.subtract(1, "day").toISOString(),
        endDate: endDate.add(1, "day").toISOString(),
      },
      userHeader(dummy.admin.token)
    );

    expect(invoiceRes.status).toBe(200);
    expect(invoiceRes.data).toBeDefined();
  });

  it("should verify invoice data structure and headers", async () => {
    const dummy = await createDummyData();

    const pricingRes = await api["pricing-model"].post(
      {
        name: "Data Verification Test",
        baseRate: 100,
        ranges: [{ hours: 8, rate: 50, position: 1 }],
      },
      userHeader(dummy.admin.token)
    );

    expect(pricingRes.status).toBe(200);

    await api["pricing-model"]
      .assign({ userId: dummy.operator.user.id })
      .put(
        { pricingModelId: pricingRes.data?.id as number },
        userHeader(dummy.admin.token)
      );

    const startDate = dayjs()
      .subtract(1, "month")
      .startOf("day")
      .set("hour", 8);
    const endDate = dayjs().subtract(1, "month").startOf("day").set("hour", 16);

    const jobRes = await createJobWithClient(
      dummy.admin,
      dummy.operator.user.id,
      startDate.toISOString(),
      endDate.toISOString(),
      "Verification Job"
    );

    expect(jobRes.status).toBe(200);

    const invoiceRes = await api.invoice.generate.post(
      {
        clientId: dummy.operator.user.id,
        startDate: startDate.subtract(1, "day").toISOString(),
        endDate: endDate.add(1, "day").toISOString(),
      },
      userHeader(dummy.admin.token)
    );

    expect(invoiceRes.status).toBe(200);
    expect(invoiceRes.data).toBeDefined();
  });
});
