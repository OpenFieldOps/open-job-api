import { pgTable, uuid } from "drizzle-orm/pg-core";
import DbUtils from "../../utils";

const { defaultVarChar } = DbUtils;

export const fileTable = pgTable("files", {
  id: uuid().primaryKey().defaultRandom(),
  fileName: defaultVarChar(),
});
