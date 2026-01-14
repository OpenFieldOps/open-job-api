import { expect } from "bun:test";

const maxLightRequestTimeout = 510;

export function userHeader(token: string) {
  return {
    headers: {
      authorization: token,
    },
  };
}

export const timeoutLightParam = {
  timeout: maxLightRequestTimeout,
};

type ApiTestExpectations = {
  status: number;
};

export async function apiTest<T extends { status: number; data?: unknown }>(
  res: T | Promise<T>,
  expectations: ApiTestExpectations = { status: 200 },
  otherAssertions?: (data: T["data"]) => void
): Promise<void> {
  const { status } = expectations;

  if (res instanceof Promise) {
    res = await res;
  }
  expect(res.status).toBe(status);
  if (otherAssertions) {
    otherAssertions(res.data);
  }
}
