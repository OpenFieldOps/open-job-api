import { beforeAll, describe, expect, it } from "bun:test";
import { app } from "..";
import { createMinimalData, dummyUser } from "../../scripts/dummy";
import { treaty } from "@elysiajs/eden";

const api = treaty(app);

describe("Auth Tests", () => {
  beforeAll(async () => {
    await createMinimalData();
  });

  it("should pass auth register test", async () => {
    const res = await api.auth.register.post(dummyUser);

    expect(res.status).toBe(200);
  });

  it("should fail auth register test with existing email", async () => {
    const res = await api.auth.register.post(dummyUser);

    expect(res.status).toBe(409);
  });

  it("shoultd pass auth login test", async () => {
    const res = await api.auth.login.post({
      email: dummyUser.email,
      password: dummyUser.password,
    });

    expect(res.status).toBe(200);
  });

  it("should fail auth login test with wrong password", async () => {
    const res = await api.auth.login.post({
      email: dummyUser.email,
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
  });
});
