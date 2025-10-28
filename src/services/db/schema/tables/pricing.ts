import { pgTable, doublePrecision, integer } from "drizzle-orm/pg-core";
import DbUtils from "../../utils";
import { userTable } from "./users";
import { relations } from "drizzle-orm";

const { defaultId, defaultVarChar, tableIdRef } = DbUtils;

export const pricingModelTable = pgTable("pricing", {
  id: defaultId(),
  userId: integer()
    .references(() => userTable.id)
    .notNull(),
  name: defaultVarChar().notNull(),
  baseRate: doublePrecision().notNull().default(0),
});

export const pricingRangeTable = pgTable("pricing_range", {
  id: defaultId(),
  pricingModelId: tableIdRef(pricingModelTable.id).notNull(),
  hours: doublePrecision().notNull(),
  rate: doublePrecision().notNull(),
  position: integer().notNull(),
});

export const pricingModelRelations = relations(
  pricingModelTable,
  ({ many }) => ({
    ranges: many(pricingRangeTable),
  })
);

export const pricingRangeRelations = relations(
  pricingRangeTable,
  ({ one }) => ({
    pricingModel: one(pricingModelTable, {
      fields: [pricingRangeTable.pricingModelId],
      references: [pricingModelTable.id],
    }),
  })
);
