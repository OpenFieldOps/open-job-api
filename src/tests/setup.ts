import { beforeAll } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { createDummyData } from "../../scripts/dummy";
import { app } from "..";
import type { AuthModel } from "../modules/auth/model";

export const api = treaty(app);
export let dummyAuthenticatedUser: AuthModel.AuthenticatedUserSuccessResponse;
export let dummyOperatorUser: AuthModel.AuthenticatedUserSuccessResponse;

beforeAll(async () => {
	const res = await createDummyData();
	dummyAuthenticatedUser = res.user;
	dummyOperatorUser = res.operator;
});
