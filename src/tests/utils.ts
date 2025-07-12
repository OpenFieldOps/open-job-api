import { expect } from "bun:test";
import { dummyAuthenticatedUser } from "./setup";

export function dummyAuthenticatedUserHeader() {
  return {
    headers: {
      authorization: dummyAuthenticatedUser.token,
    },
  };
}

const maxLightRequestTimeout = 15;

export const timeoutLightParam = {
  timeout: maxLightRequestTimeout,
};

export async function apiTest<T extends { status: number; data?: unknown }>(
  res: T | Promise<T>,
  expectedStatus: number,
  otherAssertions?: (data: T["data"]) => void
) {
  if (res instanceof Promise) {
    res = await res;
  }
  expect(res.status).toBe(expectedStatus);
  if (otherAssertions) {
    otherAssertions(res.data);
  }
}
