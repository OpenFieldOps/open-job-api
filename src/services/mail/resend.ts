import { Resend } from "resend";

export const ResendService = (
  Bun.env.RESEND_KEY ? new Resend(Bun.env.RESEND_KEY) : null
) as Resend;
