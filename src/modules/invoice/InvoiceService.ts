import { renderToBuffer } from "@react-pdf/renderer";
import { and, eq, gte, lte } from "drizzle-orm";
import { InvoicePDF } from "../../pdf/Invoice";
import { db } from "../../services/db/db";
import { jobTable } from "../../services/db/schema";
import { userTable } from "../../services/db/schema/tables/users";
import { AppError } from "../../utils/error";
import { PricingCalculationService } from "../pricing-model/PricingCalculationService";

export abstract class InvoiceService {
  static async generateClientInvoice(
    clientId: number,
    startDate: string,
    endDate: string
  ) {
    const client = await db.query.userTable.findFirst({
      where: eq(userTable.id, clientId),
      with: {
        pricing: {
          with: {
            ranges: true,
          },
        },
      },
    });

    if (!client) {
      return AppError.NotFound;
    }

    if (!client.pricingModel || !client.pricing) {
      return AppError.BadRequest;
    }

    const pricingModel = client.pricing;

    const jobs = (
      await db
        .select()
        .from(jobTable)
        .where(
          and(
            eq(jobTable.assignedClient, clientId),
            lte(jobTable.startDate, endDate),
            gte(jobTable.endDate, startDate)
          )
        )
    ).map((job) => {
      const hours = PricingCalculationService.calculateJobHours(
        job.startDate,
        job.endDate
      );
      const totalPrice = PricingCalculationService.calculatePriceWithModel(
        hours,
        pricingModel.baseRate,
        pricingModel.ranges
      );

      return {
        id: job.id.toString(),
        name: job.title,
        hours,
        totalPrice,
      };
    });

    const totalAmount = jobs.reduce(
      (sum, intervention) => sum + intervention.totalPrice,
      0
    );

    const invoiceId = `INV-${Date.now()}`;
    const invoiceDate = new Date().toISOString().split("T")[0];

    const pdf = await renderToBuffer(
      InvoicePDF({
        id: invoiceId,
        date: invoiceDate,
        client: {
          name: `${client.firstName} ${client.lastName}`,
          address: "",
          postalCode: "",
          city: "",
          email: client.email || undefined,
          phone: client.phone || undefined,
        },
        jobs,
        totalAmount,
      })
    );

    return Buffer.from(pdf);
  }
}
