import { describe, expect, it } from "bun:test";
import { api } from "./setup";
import { apiTest, dummyAuthenticatedUserHeader } from "./utils";

describe("Operators Tests", () => {
	it("Should create an operator", async () => {
		await apiTest(
			api.user["create-user"].post(
				{
					firstName: "Test",
					lastName: "Operator",
					email: "eiman@gmail.com",
					username: "eiman",
					password: "12345678",
				},
				dummyAuthenticatedUserHeader(),
			),
			200,
		);
	});

	it("Should fetch assigned users", async () => {
		await apiTest(
			api.user["assigned-users"].get(dummyAuthenticatedUserHeader()),
			200,
			(data) => {
				expect(data).toBeArray();
				expect(data).toHaveLength(1);
				if (!data || data.length === 0) {
					throw new Error("No assigned users found");
				}
				expect(data[0]).toHaveProperty("id");
				expect(data[0]).toHaveProperty("username");
			},
		);
	});
});
