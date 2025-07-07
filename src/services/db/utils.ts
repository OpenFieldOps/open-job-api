import { date, integer, PgColumn, serial, varchar } from "drizzle-orm/pg-core";

namespace DefaultTbColumns {
  export const defaultVarChar = () => varchar({ length: 255 }).notNull();
  export const defaultId = () => serial().primaryKey();
  export const defaultDate = () => date().notNull().defaultNow();
  export function tableIdRef<T extends PgColumn>(id: T) {
    return integer()
      .references(() => id)
      .notNull();
  }
}

export default DefaultTbColumns;
