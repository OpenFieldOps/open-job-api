import { drizzle } from "drizzle-orm/bun-sql";

export const db = drizzle({ connection: { url: process.env.DATABASE_URL! } });
