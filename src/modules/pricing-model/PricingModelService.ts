import { and, eq } from "drizzle-orm";
import { db } from "../../services/db/db";
import {
  pricingModelTable,
  pricingRangeTable,
} from "../../services/db/schema/tables/pricing";
import { userTable } from "../../services/db/schema/tables/users";
import { AppError } from "../../utils/error";
import type { PricingModel } from "./PricingModelModel";

export abstract class PricingModelService {
  static async createPricingModel(
    userId: number,
    data: PricingModel.PricingModelCreate
  ) {
    const pricingModel = await db
      .insert(pricingModelTable)
      .values({
        userId,
        name: data.name,
        baseRate: data.baseRate,
      })
      .returning();

    let rangesResponse: PricingModel.PricingRange[] = [];

    if (data.ranges && data.ranges.length > 0) {
      rangesResponse = await db
        .insert(pricingRangeTable)
        .values(
          data.ranges.map((range) => ({
            pricingModelId: pricingModel[0].id,
            hours: range.hours,
            rate: range.rate,
            position: range.position,
          }))
        )
        .returning();
    }

    return {
      ...pricingModel[0],
      ranges: rangesResponse || [],
    };
  }

  static async getPricingModelsByUser(userId: number) {
    return await db.query.pricingModelTable.findMany({
      where: eq(pricingModelTable.userId, userId),
      with: {
        ranges: true,
      },
    });
  }

  static async updatePricingModel(
    userId: number,
    pricingModelId: number,
    data: PricingModel.PricingModelUpdate
  ) {
    const updatedPricingModel = await db
      .update(pricingModelTable)
      .set({
        name: data.name,
        baseRate: data.baseRate,
      })
      .where(
        and(
          eq(pricingModelTable.id, pricingModelId),
          eq(pricingModelTable.userId, userId)
        )
      )
      .returning();

    let rangesResponse: PricingModel.PricingRange[] = [];
    if (data.ranges && data.ranges.length > 0) {
      await db
        .delete(pricingRangeTable)
        .where(eq(pricingRangeTable.pricingModelId, pricingModelId));

      const range = await db
        .insert(pricingRangeTable)
        .values(
          data.ranges.map((range) => ({
            pricingModelId,
            hours: range.hours,
            rate: range.rate,
            position: range.position,
          }))
        )
        .returning();

      if (range) {
        rangesResponse = range;
      }
    }

    return {
      ...updatedPricingModel[0],
      ranges: rangesResponse || [],
    };
  }

  static async deletePricingModel(userId: number, pricingModelId: number) {
    const deletedPricingModel = await db
      .delete(pricingModelTable)
      .where(
        and(
          eq(pricingModelTable.id, pricingModelId),
          eq(pricingModelTable.userId, userId)
        )
      )
      .returning();

    return deletedPricingModel[0];
  }

  static async setUserPricingModel(
    adminUserId: number,
    targetUserId: number,
    pricingModelId: number
  ) {
    // Verify that the pricing model belongs to the admin
    const pricingModel = await db.query.pricingModelTable.findFirst({
      where: and(
        eq(pricingModelTable.id, pricingModelId),
        eq(pricingModelTable.userId, adminUserId)
      ),
    });

    if (!pricingModel) {
      return AppError.NotFound;
    }

    // Update the user's pricing model
    const updatedUser = await db
      .update(userTable)
      .set({
        pricingModel: pricingModelId,
      })
      .where(eq(userTable.id, targetUserId))
      .returning();

    if (updatedUser.length === 0) {
      return AppError.NotFound;
    }

    return updatedUser[0];
  }
}
