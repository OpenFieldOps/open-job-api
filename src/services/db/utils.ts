import {
  integer,
  type PgColumn,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

namespace DefaultTbColumns {
  export const defaultVarChar = () => text().notNull();
  export const defaultId = () => serial().primaryKey();
  export const defaultDate = () =>
    timestamp({
      mode: "string",
    })
      .notNull()
      .defaultNow();
  export function tableIdRef<T extends PgColumn>(id: T) {
    return integer()
      .references(() => id, { onDelete: "cascade" })
      .notNull();
  }
}

export default DefaultTbColumns;
