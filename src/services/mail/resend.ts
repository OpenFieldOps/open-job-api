import { Resend } from "resend";

export const ResendService = new Resend(Bun.env.RESEND_KEY);
