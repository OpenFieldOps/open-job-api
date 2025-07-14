import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { config } from "../../config";

const client = new SQL(config.database.url);

export const db = drizzle({ client });
