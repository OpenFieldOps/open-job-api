import { describe, expect, it } from "bun:test";
import { api } from "./setup";

const testUser = {
  email: "test@gmail.com",
  username: "test",
  password: "12345678",
  firstName: "Suleyman",
  lastName: "Kaya",
};

describe("Auth Tests", () => {
  it("should pass auth register test", async () => {
    const res = await api.auth.register.post(testUser);

    expect(res.status).toBe(200);
  });

  it("should fail auth register test with existing email", async () => {
    const res = await api.auth.register.post(testUser);

    expect(res.status).toBe(409);
  });

  it("shoultd pass auth login test", async () => {
    const res = await api.auth.login.post({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
  });

  it("should fail auth login test with wrong password", async () => {
    const res = await api.auth.login.post({
      email: testUser.email,
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
  });
});
