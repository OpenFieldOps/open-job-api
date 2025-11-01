import { Elysia, t } from "elysia";
import { authMacroPlugin } from "../auth/macro";
import { InvoiceService } from "./InvoiceService";

export const InvoicePlugin = new Elysia({
  name: "invoice",
  prefix: "/invoice",
  tags: ["invoice"],
})
  .use(authMacroPlugin)
  .post(
    "/generate",
    async ({ body, set }) => {
      set.headers["Content-Type"] = "application/pdf";
      set.headers["Content-Disposition"] =
        `attachment; filename="invoice-${body.clientId}-${Date.now()}.pdf"`;

      return await InvoiceService.generateClientInvoice(
        body.clientId,
        body.startDate,
        body.endDate
      );
    },
    {
      body: t.Object({
        clientId: t.Number(),
        startDate: t.String(),
        endDate: t.String(),
      }),
      user: true,
    }
  );
