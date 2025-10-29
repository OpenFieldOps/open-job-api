import { describe, expect, it } from "bun:test";
import dayjs from "dayjs";
import { createDummyData } from "../../scripts/dummy";
import type { AuthModel } from "../modules/auth/AuthModel";
import { api } from "./setup";
import { userHeader } from "./utils";

const defaultPricingModelData = {
  name: "Test Income Pricing Model",
  baseRate: 50,
  ranges: [
    { hours: 8, rate: 50, position: 1 },
    { hours: 16, rate: 75, position: 2 },
  ],
};

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

describe("Job Income Tests", () => {
  it("should calculate daily income with base rate", async () => {
    const dummy = await createDummyData();

    const pricingRes = await api["pricing-model"].post(
      {
        name: "Base Rate Only",
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

    const startDate = dayjs().startOf("day").set("hour", 8);
    const endDate = dayjs().startOf("day").set("hour", 16);

    await createJobWithClient(
      dummy.admin,
      dummy.operator.user.id,
      startDate.toISOString(),
      endDate.toISOString(),
      "8 hour job"
    );

    const incomeRes = await api.job.income.get({
      query: {
        startDate: startDate.startOf("day").toISOString().split("T")[0],
        endDate: endDate.endOf("day").toISOString().split("T")[0],
      },
      ...userHeader(dummy.admin.token),
    });

    expect(incomeRes.status).toBe(200);
    expect(incomeRes.data).toBeArray();
    expect(incomeRes.data).toHaveLength(1);
    expect(incomeRes.data?.[0].income).toBe(800);
    expect(incomeRes.data?.[0].jobs).toHaveLength(1);
    expect(incomeRes.data?.[0].jobs[0].hours).toBe(8);
    expect(incomeRes.data?.[0].jobs[0].amount).toBe(800);
  });

  it("should calculate daily income with tiered pricing", async () => {
    const dummy = await createDummyData();

    const pricingRes = await api["pricing-model"].post(
      defaultPricingModelData,
      userHeader(dummy.admin.token)
    );

    expect(pricingRes.status).toBe(200);

    await api["pricing-model"]
      .assign({ userId: dummy.operator.user.id })
      .put(
        { pricingModelId: pricingRes.data?.id as number },
        userHeader(dummy.admin.token)
      );

    const startDate = dayjs().startOf("day").set("hour", 8);
    const endDate = dayjs().startOf("day").set("hour", 20);

    await createJobWithClient(
      dummy.admin,
      dummy.operator.user.id,
      startDate.toISOString(),
      endDate.toISOString(),
      "12 hour job"
    );

    const incomeRes = await api.job.income.get({
      query: {
        startDate: startDate.startOf("day").toISOString().split("T")[0],
        endDate: endDate.endOf("day").toISOString().split("T")[0],
      },
      ...userHeader(dummy.admin.token),
    });

    expect(incomeRes.status).toBe(200);
    expect(incomeRes.data).toBeArray();
    expect(incomeRes.data).toHaveLength(1);
    expect(incomeRes.data?.[0].jobs).toHaveLength(1);
    expect(incomeRes.data?.[0].jobs[0].hours).toBe(12);
    expect(incomeRes.data?.[0].jobs[0].amount).toBe(700);
  });

  it("should calculate income for multi-day jobs", async () => {
    const dummy = await createDummyData();

    const pricingRes = await api["pricing-model"].post(
      {
        name: "Multi-Day Rate",
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

    const startDate = dayjs().startOf("day").set("hour", 8);
    const endDate = dayjs().add(2, "day").startOf("day").set("hour", 16);

    await createJobWithClient(
      dummy.admin,
      dummy.operator.user.id,
      startDate.toISOString(),
      endDate.toISOString(),
      "3 day job"
    );

    const incomeRes = await api.job.income.get({
      query: {
        startDate: startDate.startOf("day").toISOString().split("T")[0],
        endDate: endDate.endOf("day").toISOString().split("T")[0],
      },
      ...userHeader(dummy.admin.token),
    });

    expect(incomeRes.status).toBe(200);
    expect(incomeRes.data).toBeArray();
    expect(incomeRes.data).toHaveLength(3);

    const totalRevenue = incomeRes.data?.reduce(
      (sum, day) => sum + day.income,
      0
    );
    expect(totalRevenue).toBeGreaterThan(2000);
  });

  it("should calculate income for multiple jobs on the same day", async () => {
    const dummy = await createDummyData();

    const pricingRes = await api["pricing-model"].post(
      {
        name: "Same Day Rate",
        baseRate: 50,
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

    const startDate = dayjs().startOf("day").set("hour", 8);

    await createJobWithClient(
      dummy.admin,
      dummy.operator.user.id,
      startDate.toISOString(),
      startDate.add(4, "hour").toISOString(),
      "4 hour job morning"
    );

    await createJobWithClient(
      dummy.admin,
      dummy.operator.user.id,
      startDate.add(5, "hour").toISOString(),
      startDate.add(9, "hour").toISOString(),
      "4 hour job afternoon"
    );

    const incomeRes = await api.job.income.get({
      query: {
        startDate: startDate.startOf("day").toISOString().split("T")[0],
        endDate: startDate.endOf("day").toISOString().split("T")[0],
      },
      ...userHeader(dummy.admin.token),
    });

    expect(incomeRes.status).toBe(200);
    expect(incomeRes.data).toBeArray();
    expect(incomeRes.data).toHaveLength(1);
    expect(incomeRes.data?.[0].jobs).toHaveLength(2);
    expect(incomeRes.data?.[0].income).toBe(400);
  });

  it("should return zero income for jobs without pricing model", async () => {
    const dummy = await createDummyData();

    const startDate = dayjs().startOf("day").set("hour", 8);
    const endDate = dayjs().startOf("day").set("hour", 16);

    await createJobWithClient(
      dummy.admin,
      dummy.operator.user.id,
      startDate.toISOString(),
      endDate.toISOString(),
      "Job without pricing"
    );

    const incomeRes = await api.job.income.get({
      query: {
        startDate: startDate.startOf("day").toISOString().split("T")[0],
        endDate: endDate.endOf("day").toISOString().split("T")[0],
      },
      ...userHeader(dummy.admin.token),
    });

    expect(incomeRes.status).toBe(200);
    expect(incomeRes.data).toBeArray();
    expect(incomeRes.data).toHaveLength(1);
    expect(incomeRes.data?.[0].income).toBe(0);
    expect(incomeRes.data?.[0].jobs).toHaveLength(1);
    expect(incomeRes.data?.[0].jobs[0].amount).toBe(0);
  });

  it("should return empty array for date range with no jobs", async () => {
    const dummy = await createDummyData();

    const startDate = dayjs().add(10, "day").startOf("day");
    const endDate = dayjs().add(12, "day").endOf("day");

    const incomeRes = await api.job.income.get({
      query: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
      ...userHeader(dummy.admin.token),
    });

    expect(incomeRes.status).toBe(200);
    expect(incomeRes.data).toBeArray();
    expect(incomeRes.data).toHaveLength(3);
    expect(incomeRes.data?.[0].income).toBe(0);
    expect(incomeRes.data?.[0].jobs).toHaveLength(0);
  });

  it("should include client name in income response", async () => {
    const dummy = await createDummyData();

    const pricingRes = await api["pricing-model"].post(
      {
        name: "Client Name Test",
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

    const startDate = dayjs().startOf("day").set("hour", 8);
    const endDate = dayjs().startOf("day").set("hour", 16);

    await createJobWithClient(
      dummy.admin,
      dummy.operator.user.id,
      startDate.toISOString(),
      endDate.toISOString(),
      "Client name test job"
    );

    const incomeRes = await api.job.income.get({
      query: {
        startDate: startDate.startOf("day").toISOString().split("T")[0],
        endDate: endDate.endOf("day").toISOString().split("T")[0],
      },
      ...userHeader(dummy.admin.token),
    });

    expect(incomeRes.status).toBe(200);
    expect(incomeRes.data?.[0].jobs[0]).toHaveProperty("clientName");
    expect(incomeRes.data?.[0].jobs[0].clientName).toContain(
      dummy.operator.user.firstName
    );
  });

  it("should calculate income with progressive tiers correctly", async () => {
    const dummy = await createDummyData();

    const pricingRes = await api["pricing-model"].post(
      {
        name: "Progressive Tiers",
        baseRate: 40,
        ranges: [
          { hours: 4, rate: 50, position: 1 },
          { hours: 8, rate: 75, position: 2 },
          { hours: 12, rate: 100, position: 3 },
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

    const startDate = dayjs().startOf("day").set("hour", 8);
    const endDate = dayjs().startOf("day").set("hour", 20);

    await createJobWithClient(
      dummy.admin,
      dummy.operator.user.id,
      startDate.toISOString(),
      endDate.toISOString(),
      "12 hour progressive job"
    );

    const incomeRes = await api.job.income.get({
      query: {
        startDate: startDate.startOf("day").toISOString().split("T")[0],
        endDate: endDate.endOf("day").toISOString().split("T")[0],
      },
      ...userHeader(dummy.admin.token),
    });

    expect(incomeRes.status).toBe(200);
    expect(incomeRes.data?.[0].jobs[0].hours).toBe(12);
    expect(incomeRes.data?.[0].jobs[0].amount).toBe(900);
  });

  it("should accept full ISO date strings", async () => {
    const dummy = await createDummyData();

    const pricingRes = await api["pricing-model"].post(
      {
        name: "ISO Date Test",
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

    const jobDate = dayjs().startOf("day");
    const startDate = jobDate.set("hour", 8);
    const endDate = jobDate.set("hour", 16);

    await createJobWithClient(
      dummy.admin,
      dummy.operator.user.id,
      startDate.toISOString(),
      endDate.toISOString(),
      "ISO date test job"
    );

    const incomeRes = await api.job.income.get({
      query: {
        startDate: jobDate.startOf("day").toISOString(),
        endDate: jobDate.endOf("day").toISOString(),
      },
      ...userHeader(dummy.admin.token),
    });

    expect(incomeRes.status).toBe(200);
    expect(incomeRes.data).toBeArray();
    expect(incomeRes.data).not.toBeNull();

    if (!incomeRes.data) {
      throw new Error("No data returned");
    }

    expect(incomeRes.data.length).toBe(1);
    expect(incomeRes.data[0].jobs).toHaveLength(1);
    expect(incomeRes.data[0].income).toBe(800);
    expect(incomeRes.data[0].date).toBeDefined();
  });
});
