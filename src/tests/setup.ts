import { afterEach, beforeEach } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { sql } from "drizzle-orm";
import { type App, app } from "../main";
import { db } from "../services/db/db";

import "../main";
import { sleep } from "bun";

export const api = treaty<App>(app).api;

beforeEach(async () => {
  await db.execute(sql`BEGIN`);
  await sleep(15);
});

afterEach(async () => {
  await sleep(30);
  await db.execute(sql`ROLLBACK`);
});
