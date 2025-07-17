import { expect } from "bun:test";
import { sqlLogs } from "../services/db/db";
import { dummyAuthenticatedUser } from "./setup";

export function dummyAuthenticatedUserHeader() {
	return {
		headers: {
			authorization: dummyAuthenticatedUser.token,
		},
	};
}

export function dummyOperatorUserHeader() {
	return {
		headers: {
			authorization: dummyAuthenticatedUser.token,
		},
	};
}

const maxLightRequestTimeout = 30;

export const timeoutLightParam = {
	timeout: maxLightRequestTimeout,
};

export async function apiTest<T extends { status: number; data?: unknown }>(
	res: T | Promise<T>,
	expectedStatus: number,
	otherAssertions?: (data: T["data"]) => void,
): Promise<void> {
	if (res instanceof Promise) {
		res = await res;
	}
	expect(res.status).toBe(expectedStatus);
	if (otherAssertions) {
		otherAssertions(res.data);
	}
}

export async function sqlCount(func: () => Promise<void>, maxSql: number = 1) {
	sqlLogs.length = 0;
	await func();
	expect(sqlLogs.length).toBeLessThanOrEqual(maxSql);
}
