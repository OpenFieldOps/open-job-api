import { describe, expect, it } from "bun:test";
import { api, dummyAuthenticatedUser } from "./setup";
import dayjs from "dayjs";
import {
  apiTest,
  dummyAuthenticatedUserHeader,
  timeoutLightParam,
} from "./utils";

describe("Interventions Tests", () => {
  it(
    "should show no interventions",
    async () => {
      apiTest(
        api.intervention.get({
          query: {
            start: dayjs().toISOString(),
            end: dayjs().add(1, "day").toISOString(),
          },
          ...dummyAuthenticatedUserHeader(),
        }),
        200,
        (data) => {
          expect(data).toBeArray();
          expect(data).toHaveLength(0);
        }
      );
    },
    timeoutLightParam
  );

  const title = "Test Intervention";
  const description = "This is a test intervention";

  it(
    "should create an intervention",
    async () => {
      await apiTest(
        api.intervention.post(
          {
            title,
            description,
            assignedTo: dummyAuthenticatedUser.user.id,
          },
          dummyAuthenticatedUserHeader()
        ),
        200,
        (data) => {
          expect(data).toBeObject();
          expect(data).toHaveProperty("id");
          expect(data?.title).toBe(title);
          expect(data?.description).toBe(description);
        }
      );
    },
    timeoutLightParam
  );

  it(
    "should show created intervention",
    async () => {
      await apiTest(
        api.intervention.get({
          query: {
            start: dayjs().subtract(1, "day").toISOString(),
            end: dayjs().add(1, "day").toISOString(),
          },
          ...dummyAuthenticatedUserHeader(),
        }),
        200,
        (data) => {
          expect(data).toBeArray();
          expect(data).toHaveLength(1);
          const intervention = data![0];
          expect(intervention).toHaveProperty("id");
          expect(intervention.title).toBe(title);
          expect(intervention.description).toBe(description);
        }
      );
    },
    timeoutLightParam
  );

  it(
    "shouldn't create an intervention with no authentication",
    async () => {
      await apiTest(
        api.intervention.post({
          title,
          description,
          assignedTo: dummyAuthenticatedUser.user.id,
        }),
        401,
        (data) => {
          expect(data).toBeNull();
        }
      );
    },
    timeoutLightParam
  );

  it(
    "should update an intervention",
    async () => {
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

      await apiTest(
        api.intervention.patch(
          {
            id: intervention.id,
            title: updatedTitle,
            description: updatedDescription,
          },
          dummyAuthenticatedUserHeader()
        ),
        200,
        (data) => {
          expect(data).toBeFalsy();
        }
      );
    },
    timeoutLightParam
  );

  it(
    "should delete an intervention",
    async () => {
      const intervention = (
        await api.intervention.get({
          query: {
            start: dayjs().subtract(1, "day").toISOString(),
            end: dayjs().add(1, "day").toISOString(),
          },
          ...dummyAuthenticatedUserHeader(),
        })
      ).data![0];

      await apiTest(
        api
          .intervention({ id: intervention.id })
          .delete(undefined, dummyAuthenticatedUserHeader()),
        200,
        (data) => {
          expect(data).toBeFalsy();
        }
      );
    },
    timeoutLightParam
  );

  it(
    "should show no interventions after deletion",
    async () => {
      const res = await api.intervention.get({
        query: {
          start: dayjs().subtract(1, "day").toISOString(),
          end: dayjs().add(1, "day").toISOString(),
        },
        ...dummyAuthenticatedUserHeader(),
      });

      expect(res.status).toBe(200);
      expect(res.data).toBeArray();
      expect(res.data).toHaveLength(0);
    },
    timeoutLightParam
  );

  it(
    "should not allow creating an intervention with invalid data",
    async () => {
      const res = await api.intervention.post(
        {
          title: "",
          description: "This is an invalid test intervention",
          assignedTo: dummyAuthenticatedUser.user.id,
        },
        dummyAuthenticatedUserHeader()
      );

      expect(res.status).toBe(422);
    },
    timeoutLightParam
  );
});
