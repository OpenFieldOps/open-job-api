import {
  type AnyPgColumn,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import DbUtils from "../../utils";
import { roleEnum } from "../enums";
import { fileTable } from "./files";
import { pricingModelTable } from "./pricing";

const { defaultId, defaultDate, defaultVarChar, tableIdRef } = DbUtils;

export const userTable = pgTable("users", {
  id: defaultId(),
  lastName: defaultVarChar(),
  lastSeen: defaultDate(),
  firstName: defaultVarChar(),
  username: defaultVarChar(),
  password: defaultVarChar(),
  email: defaultVarChar().unique(),
  phone: text().notNull().default(""),
  avatar: uuid().references(() => fileTable.id),
  role: roleEnum("role").notNull().default("operator"),
  pricingModel: integer().references((): AnyPgColumn => pricingModelTable.id),
});

export const userLocationTable = pgTable(
  "user_location",
  {
    id: defaultId(),
    userId: tableIdRef(userTable.id).notNull().unique(),
    latitude: doublePrecision(),
    longitude: doublePrecision(),
    updatedAt: defaultDate()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  (userLocation) => [index("user_location_user_id_idx").on(userLocation.userId)]
);

export const userAdminTable = pgTable("users_admin", {
  id: defaultId(),
  userId: tableIdRef(userTable.id).unique(),
  adminId: tableIdRef(userTable.id),
});

export const userSupervisorTable = pgTable("users_supervisor", {
  id: defaultId(),
  userId: tableIdRef(userTable.id).unique(),
  supervisorId: tableIdRef(userTable.id),
});
