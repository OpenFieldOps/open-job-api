import { afterEach, beforeEach } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { sql } from "drizzle-orm";
import { app } from "../main";
import { db } from "../services/db/db";

export const api = treaty(app);

beforeEach(async () => {
  await db.execute(sql`BEGIN`);
});

afterEach(async () => {
  await db.execute(sql`ROLLBACK`);
});
