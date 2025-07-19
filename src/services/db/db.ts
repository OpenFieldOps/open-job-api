import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { config } from "../../config";
// biome-ignore lint/performance/noNamespaceImport: This is a common pattern for importing schema in Drizzle ORM.
import * as schema from "./schema";

const client = new SQL(config.database.url);

export const sqlLogs: string[] = [];

export const db = drizzle({
	client,
	schema: schema,
	logger: {
		logQuery(query) {
			sqlLogs.push(query);
		},
	},
});

db.$client
	.connect()
	.then(() => {
		console.log(
			"Connected to the database successfully at",
			config.database.url,
		);
	})
	.catch((error) => {
		console.error("Failed to connect to the database:", error);
		process.exit(1);
	});
