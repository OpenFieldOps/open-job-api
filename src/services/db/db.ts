import { drizzle } from "drizzle-orm/bun-sql";
import { SQL } from "bun";
import { config } from "../../config";

const client = new SQL(config.database.url);

export const db = drizzle({ client });
