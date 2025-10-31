import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { config } from "../../config";
import * as schema from "./schema";

const client = new SQL(config.database.url, {
  max: Bun.env.NODE_ENV === "test" ? 1 : 5,
});

export const db = drizzle({
  client,
  schema: schema,
});

await db.$client
  .connect()
  .then(() => {
    if (Bun.env.NODE_ENV !== "test") {
      console.log(
        "Connected to the database successfully at",
        config.database.url
      );
    }
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  });
