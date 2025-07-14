import { describe, expect, it } from "bun:test";
import dayjs from "dayjs";
import { api, dummyAuthenticatedUser } from "./setup";
import {
	apiTest,
	dummyAuthenticatedUserHeader,
	dummyOperatorUserHeader,
	timeoutLightParam,
} from "./utils";

describe("Jobs Tests", () => {
	it(
		"should show no Jobs",
		async () => {
			apiTest(
				api.job.get({
					query: {
						end: dayjs().add(1, "day").toISOString(),
						start: dayjs().toISOString(),
					},
					...dummyAuthenticatedUserHeader(),
				}),
				200,
				(data) => {
					expect(data).toBeArray();
					expect(data).toHaveLength(0);
				},
			);
		},
		timeoutLightParam,
	);

	const title = "Test Job";
	const description = "This is a test Job";

	it(
		"should create an Job",
		async () => {
			await apiTest(
				api.job.post(
					{
						assignedTo: dummyAuthenticatedUser.user.id,
						description,
						title,
					},
					dummyAuthenticatedUserHeader(),
				),
				200,
				(data) => {
					expect(data).toBeObject();
					expect(data).toHaveProperty("id");
					expect(data?.title).toBe(title);
					expect(data?.description).toBe(description);
				},
			);
		},
		timeoutLightParam,
	);

	it(
		"should show created Job",
		async () => {
			await apiTest(
				api.job.get({
					query: {
						end: dayjs().add(1, "day").toISOString(),
						start: dayjs().subtract(1, "day").toISOString(),
					},
					...dummyAuthenticatedUserHeader(),
				}),
				200,
				(data) => {
					expect(data).toBeArray();
					expect(data).toHaveLength(1);
					const res = data ? data[0] : null;
					if (!res) {
						throw new Error("No job found");
					}
					expect(res).toHaveProperty("id");
					expect(res.title).toBe(title);
					expect(res.description).toBe(description);
				},
			);
		},
		timeoutLightParam,
	);

	it(
		"shouldn't create an Job with no authentication",
		async () => {
			await apiTest(
				api.job.post({
					assignedTo: dummyAuthenticatedUser.user.id,
					description,
					title,
				}),
				401,
				(data) => {
					expect(data).toBeNull();
				},
			);
		},
		timeoutLightParam,
	);

	it(
		"should update an Job",
		async () => {
			const res = await api.job.get({
				query: {
					end: dayjs().add(1, "day").toISOString(),
					start: dayjs().subtract(1, "day").toISOString(),
				},
				...dummyAuthenticatedUserHeader(),
			});

			const job = res.data ? res.data[0] : null;

			if (!job) {
				throw new Error("No job found to update");
			}

			const updatedTitle = "Updated Test Job";
			const updatedDescription = "This is an updated test Job";

			await apiTest(
				api.job.patch(
					{
						description: updatedDescription,
						id: job.id,
						title: updatedTitle,
					},
					dummyAuthenticatedUserHeader(),
				),
				200,
				(data) => {
					expect(data).toBeFalsy();
				},
			);
		},
		timeoutLightParam,
	);

	it(
		"should delete an job",
		async () => {
			const res = (
				await api.job.get({
					query: {
						end: dayjs().add(1, "day").toISOString(),
						start: dayjs().subtract(1, "day").toISOString(),
					},
					...dummyAuthenticatedUserHeader(),
				})
			).data;

			const job = res ? res[0] : null;

			if (!job) {
				throw new Error("No job found to delete");
			}

			await apiTest(
				api
					.job({ id: job.id })
					.delete(undefined, dummyAuthenticatedUserHeader()),
				200,
			);
		},
		timeoutLightParam,
	);

	it(
		"should show no Jobs after deletion",
		async () => {
			await apiTest(
				api.job.get({
					query: {
						end: dayjs().add(1, "day").toISOString(),
						start: dayjs().subtract(1, "day").toISOString(),
					},
					...dummyAuthenticatedUserHeader(),
				}),
				200,
				(data) => {
					expect(data).toBeArray();
					expect(data).toHaveLength(0);
				},
			);
		},
		timeoutLightParam,
	);

	it(
		"should not allow creating an Job with invalid data",
		async () => {
			await apiTest(
				api.job.post(
					{
						assignedTo: dummyAuthenticatedUser.user.id,
						description: "This is an invalid test Job",
						title: "",
					},
					dummyAuthenticatedUserHeader(),
				),
				422,
			);
		},
		timeoutLightParam,
	);

	it(
		"should not allow deleting a Job with invalid ID",
		async () => {
			await apiTest(
				api.job({ id: 999 }).delete(undefined, dummyAuthenticatedUserHeader()),
				404,
			);
		},
		timeoutLightParam,
	);

	it("should not allow deleting a job if your a operator", async () => {
		await api.job.post(
			{
				assignedTo: dummyAuthenticatedUser.user.id,
				description,
				title,
			},
			dummyAuthenticatedUserHeader(),
		);

		await apiTest(
			api.job({ id: 1 }).delete(undefined, dummyOperatorUserHeader()),
			404,
		);
	});
});
