import { $ } from "bun";
import { config } from "../src/config";

const arg = Bun.argv[2];

await $`
export DATABASE_URL=${config.database.url}
bunx drizzle-kit ${arg}
`.nothrow();
