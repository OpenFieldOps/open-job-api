import { describe, expect, it } from "bun:test";
import { api } from "./setup.test";
import { dummyAuthenticatedUserHeader } from "./utils";

describe("User Tests", () => {
  it("should get avatar URL", async () => {
    const res = await api.user.avatar.get({
      ...dummyAuthenticatedUserHeader(),
    });

    expect(res.status).toBe(200);
    expect(res.data).toBeString();
  });
});
