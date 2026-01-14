import type { fileTable } from "../../services/db/schema";

export namespace FileModel {
  export type DbFile = typeof fileTable.$inferSelect;
}
