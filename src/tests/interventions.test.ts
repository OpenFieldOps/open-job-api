import { describe, expect, it } from "bun:test";
import { api, dummyAuthenticatedUser } from "./setup.test";
import dayjs from "dayjs";
import { dummyAuthenticatedUserHeader } from "./utils";

describe("Interventions Tests", () => {
  it("should show no interventions", async () => {
    const res = await api.intervention.get({
      query: {
        start: dayjs().toISOString(),
        end: dayjs().add(1, "day").toISOString(),
      },
      ...dummyAuthenticatedUserHeader(),
    });

    expect(res.status).toBe(200);
    expect(res.data).toBeArray();
  });

  const title = "Test Intervention";
  const description = "This is a test intervention";

  it("should create an intervention", async () => {
    const res = await api.intervention.post(
      {
        title,
        description,
        assignedTo: dummyAuthenticatedUser.user.id,
      },
      dummyAuthenticatedUserHeader()
    );

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("id");
    expect(res.data?.title).toBe(title);
    expect(res.data?.description).toBe(description);
  });

  it("should show created intervention", async () => {
    const res = await api.intervention.get({
      query: {
        start: dayjs().subtract(1, "day").toISOString(),
        end: dayjs().add(1, "day").toISOString(),
      },
      ...dummyAuthenticatedUserHeader(),
    });

    expect(res.status).toBe(200);
    expect(res.data).toBeArray();
    expect(res.data).toHaveLength(1);
    const intervention = res.data![0];
    expect(intervention).toHaveProperty("id");
    expect(intervention.title).toBe(title);
    expect(intervention.description).toBe(description);
  });

  it("shouldn't create an intervention with no authentication", async () => {
    const title = "Test Intervention";
    const description = "This is a test intervention";
    const res = await api.intervention.post({
      title,
      description,
      assignedTo: dummyAuthenticatedUser.user.id,
    });

    expect(res.status).toBe(401);
  });

  it("should update an intervention", async () => {
    const intervention = (
      await api.intervention.get({
        query: {
          start: dayjs().subtract(1, "day").toISOString(),
          end: dayjs().add(1, "day").toISOString(),
        },
        ...dummyAuthenticatedUserHeader(),
      })
    ).data![0];

    const updatedTitle = "Updated Test Intervention";
    const updatedDescription = "This is an updated test intervention";

    const res = await api.intervention.patch(
      {
        id: intervention.id,
        title: updatedTitle,
        description: updatedDescription,
      },
      dummyAuthenticatedUserHeader()
    );

    expect(res.status).toBe(200);
  });
});
