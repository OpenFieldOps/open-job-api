import { renderToBuffer } from "@react-pdf/renderer";
import { and, eq, gte, lte } from "drizzle-orm";
import { ElysiaCustomStatusResponse } from "elysia";
import InvoiceEmail from "../../emails/InvoicEmail";
import { InvoicePDF } from "../../pdf/Invoice";
import { db } from "../../services/db/db";
import { jobTable } from "../../services/db/schema";
import {
	userAdminTable,
	userTable,
} from "../../services/db/schema/tables/users";
import { sendEmail } from "../../services/mail/resend";
import { FileStorageService } from "../../services/storage/s3";
import { AppError } from "../../utils/error";
import { PricingCalculationService } from "../pricing-model/PricingCalculationService";

export abstract class InvoiceService {
	static async generateClientInvoice(
		clientId: number,
		startDate: string,
		endDate: string,
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
						gte(jobTable.endDate, startDate),
					),
				)
		).map((job) => {
			const hours = PricingCalculationService.calculateJobHours(
				job.startDate,
				job.endDate,
			);
			const totalPrice = PricingCalculationService.calculatePriceWithModel(
				hours,
				pricingModel.baseRate,
				pricingModel.ranges,
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
			0,
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
			}),
		);

		return Buffer.from(pdf);
	}

	static async sendInvoiceToClient(
		userId: number,
		clientId: number,
		startDate: string,
		endDate: string,
	) {
		const buffer = await InvoiceService.generateClientInvoice(
			clientId,
			startDate,
			endDate,
		);

		if (buffer instanceof ElysiaCustomStatusResponse) {
			return buffer;
		}

		const fileId = await FileStorageService.uploadBuffer(
			buffer,
			`invoice-${clientId}-${Date.now()}.pdf`,
		);

		const downloadUrl = FileStorageService.getOneMonthDownloadUrl(fileId);

		const clientWithEmail = (
			await db
				.select({
					email: userTable.email,
				})
				.from(userTable)
				.leftJoin(userAdminTable, eq(userAdminTable.userId, userTable.id))
				.where(
					and(eq(userTable.id, clientId), eq(userAdminTable.adminId, userId)),
				)
				.limit(1)
		).pop();

		if (!clientWithEmail) {
			return AppError.NotFound;
		}

		await sendEmail(
			InvoiceEmail({
				invoiceDownloadLink: downloadUrl,
				from: new Date(startDate),
				to: new Date(endDate),
			}),
			clientWithEmail.email,
			"Your Invoice is Ready",
		);
	}
}
