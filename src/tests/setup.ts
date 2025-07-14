import { beforeAll } from "bun:test";
import { createDummyData, createMinimalData } from "../../scripts/dummy";
import { treaty } from "@elysiajs/eden";
import { app } from "..";
import type { AuthModel } from "../modules/auth/model";

export const api = treaty(app);
export let dummyAuthenticatedUser: AuthModel.AuthenticatedUserSuccessResponse;
export let dummyOperatorUser: AuthModel.AuthenticatedUserSuccessResponse;

beforeAll(async () => {
  await createMinimalData();
  const res = await createDummyData();
  dummyAuthenticatedUser = res.user;
  dummyOperatorUser = res.operator;
});
