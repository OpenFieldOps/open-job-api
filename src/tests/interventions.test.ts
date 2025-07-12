import { describe, expect, it } from "bun:test";
import { api, dummyAuthenticatedUser } from "./setup";
import dayjs from "dayjs";
import {
  apiTest,
  dummyAuthenticatedUserHeader,
  timeoutLightParam,
} from "./utils";

describe("Jobs Tests", () => {
  it(
    "should show no Jobs",
    async () => {
      apiTest(
        api.job.get({
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

  const title = "Test Job";
  const description = "This is a test Job";

  it(
    "should create an Job",
    async () => {
      await apiTest(
        api.job.post(
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
    "should show created Job",
    async () => {
      await apiTest(
        api.job.get({
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
          const Job = data![0];
          expect(Job).toHaveProperty("id");
          expect(Job.title).toBe(title);
          expect(Job.description).toBe(description);
        }
      );
    },
    timeoutLightParam
  );

  it(
    "shouldn't create an Job with no authentication",
    async () => {
      await apiTest(
        api.job.post({
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
    "should update an Job",
    async () => {
      const Job = (
        await api.job.get({
          query: {
            start: dayjs().subtract(1, "day").toISOString(),
            end: dayjs().add(1, "day").toISOString(),
          },
          ...dummyAuthenticatedUserHeader(),
        })
      ).data![0];

      const updatedTitle = "Updated Test Job";
      const updatedDescription = "This is an updated test Job";

      await apiTest(
        api.job.patch(
          {
            id: Job.id,
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
    "should delete an job",
    async () => {
      const job = (
        await api.job.get({
          query: {
            start: dayjs().subtract(1, "day").toISOString(),
            end: dayjs().add(1, "day").toISOString(),
          },
          ...dummyAuthenticatedUserHeader(),
        })
      ).data![0];

      await apiTest(
        api
          .job({ id: job.id })
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
    "should show no Jobs after deletion",
    async () => {
      await apiTest(
        api.job.get({
          query: {
            start: dayjs().subtract(1, "day").toISOString(),
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

  it(
    "should not allow creating an Job with invalid data",
    async () => {
      await apiTest(
        api.job.post(
          {
            title: "",
            description: "This is an invalid test Job",
            assignedTo: dummyAuthenticatedUser.user.id,
          },
          dummyAuthenticatedUserHeader()
        ),
        422
      );
    },
    timeoutLightParam
  );
});
