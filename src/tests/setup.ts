import { afterEach, beforeEach } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { sql } from "drizzle-orm";
import { type App, app } from "../main";
import { db } from "../services/db/db";

import "../main";

export const api = treaty<App>(app).api;

beforeEach(async () => {
  await db.execute(sql`BEGIN`);
});

afterEach(async () => {
  await db.execute(sql`ROLLBACK`);
});
