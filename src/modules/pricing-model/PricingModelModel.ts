import { t } from "elysia";

export namespace PricingModel {
  export const PricingRange = t.Object({
    id: t.Number(),
    hours: t.Number({ minimum: 0 }),
    rate: t.Number({ minimum: 0 }),
    position: t.Number({ minimum: 0 }),
  });
  export const PricingModel = t.Object({
    id: t.Number(),
    name: t.String({ minLength: 1, maxLength: 100 }),
    baseRate: t.Number({ minimum: 0 }),
    ranges: t.Array(PricingRange),
  });
  export type PricingRange = typeof PricingRange.static;
  export type PricingModel = typeof PricingModel.static;

  export const PricingRangeCreate = t.Object({
    hours: t.Number({ minimum: 0 }),
    rate: t.Number({ minimum: 0 }),
    position: t.Number({ minimum: 0 }),
  });

  export const PricingModelCreate = t.Object({
    name: t.String({ minLength: 1, maxLength: 100 }),
    baseRate: t.Number({ minimum: 0 }),
    ranges: t.Array(PricingRangeCreate),
  });

  export const PricingModelUpdate = t.Object({
    id: t.Number(),
    name: t.String({ minLength: 1, maxLength: 100 }),
    baseRate: t.Number({ minimum: 0 }),
    ranges: t.Optional(t.Array(PricingRangeCreate)),
  });

  export type PricingModelUpdate = typeof PricingModelUpdate.static;
  export type PricingRangeCreate = typeof PricingRangeCreate.static;
  export type PricingModelCreate = typeof PricingModelCreate.static;
}
