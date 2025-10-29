import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: ["./src/services/db/schema.ts"],
  dialect: "postgresql",
  dbCredentials: {
    url: "postgres://testuser:testpass@localhost:55432/testdb",
  },
});
