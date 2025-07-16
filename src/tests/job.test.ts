import { describe, expect, it } from "bun:test";
import dayjs from "dayjs";
import { api, dummyAuthenticatedUser } from "./setup";
import {
	apiTest,
	dummyAuthenticatedUserHeader,
	dummyOperatorUserHeader,
	sqlCount,
	timeoutLightParam,
} from "./utils";

const dayInterval = {
	end: dayjs().add(1, "day").toISOString(),
	start: dayjs().subtract(1, "day").toISOString(),
};

const defaultJobQuery = () =>
	api.job.get({
		query: dayInterval,
		...dummyAuthenticatedUserHeader(),
	});

describe("Jobs Tests", () => {
	it(
		"should show no Jobs",
		async () => {
			await sqlCount(async () => {
				await apiTest(defaultJobQuery(), 200, (data) => {
					expect(data).toBeArray();
					expect(data).toHaveLength(0);
				});
			});
		},
		timeoutLightParam,
	);

	const title = "Test Job";
	const description = "This is a test Job";

	it(
		"should create an Job",
		async () => {
			await sqlCount(async () => {
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
			}, 2);
		},
		timeoutLightParam,
	);

	it(
		"should show created Job",
		async () => {
			await sqlCount(async () => {
				await apiTest(defaultJobQuery(), 200, (data) => {
					expect(data).toBeArray();
					expect(data).toHaveLength(1);
					const res = data ? data[0] : null;
					if (!res) {
						throw new Error("No job found");
					}
					expect(res).toHaveProperty("id");
					expect(res.title).toBe(title);
					expect(res.description).toBe(description);
				});
			});
		},
		timeoutLightParam,
	);

	it(
		"shouldn't create an Job with no authentication",
		async () => {
			await sqlCount(async () => {
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
			});
		},
		timeoutLightParam,
	);

	it(
		"should update an Job",
		async () => {
			await sqlCount(async () => {
				const res = await defaultJobQuery();

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
			}, 2);
		},
		timeoutLightParam,
	);

	it(
		"should delete an job",
		async () => {
			await sqlCount(async () => {
				const res = (await defaultJobQuery()).data;

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
			}, 2);
		},
		timeoutLightParam,
	);

	it(
		"should show no Jobs after deletion",
		async () => {
			await apiTest(defaultJobQuery(), 200, (data) => {
				expect(data).toBeArray();
				expect(data).toHaveLength(0);
			});
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

	it("should create a job document", async () => {
		const job = (await defaultJobQuery()).data?.[0];

		if (!job) {
			throw new Error("No job found to create a document for");
		}

		const file = new File(["Test content"], "test.txt", { type: "text/plain" });

		await apiTest(
			api.job
				.documents({ jobId: job.id })
				.post({ file }, dummyAuthenticatedUserHeader()),
			200,
			(data) => {
				expect(data).toBeObject();
				expect(data).toHaveProperty("id");
			},
		);
	});

	it("should fetch job documents", async () => {
		const job = (await defaultJobQuery()).data?.[0];

		if (!job) {
			throw new Error("No job found to fetch documents for");
		}

		await apiTest(
			api.job.documents({ jobId: job.id }).get(dummyAuthenticatedUserHeader()),
			200,
			(data) => {
				expect(data).toBeArray();
				expect(data).toHaveLength(1);
			},
		);
	});

	it("should delete a job document", async () => {
		const job = (await defaultJobQuery()).data?.[0];

		if (!job) {
			throw new Error("No job found to delete a document for");
		}

		const documents = (
			await api.job
				.documents({ jobId: job.id })
				.get(dummyAuthenticatedUserHeader())
		).data as Array<{ id: string; fileName: string }>;

		if (documents && documents.length === 0) {
			throw new Error("No documents found to delete");
		}

		const fileId = documents[0].id;

		await apiTest(
			api.job["delete-document"].delete(
				{ jobId: job.id, fileId },
				dummyAuthenticatedUserHeader(),
			),
			200,
			(data) => {
				expect(data).toBeFalsy();
			},
		);
	});

	it("should not show deleted job documents", async () => {
		const job = (await defaultJobQuery()).data?.[0];

		if (!job) {
			throw new Error("No job found to check documents for");
		}

		await apiTest(
			api.job.documents({ jobId: job.id }).get(dummyAuthenticatedUserHeader()),
			200,
			(data) => {
				expect(data).toBeArray();
				expect(data).toHaveLength(0);
			},
		);
	});
});
