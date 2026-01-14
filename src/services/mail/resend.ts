import type { ReactNode } from "react";
import { Resend } from "resend";

const resend = new Resend(Bun.env.RESEND_KEY);

export async function sendEmail(
	component: ReactNode,
	to: string,
	subject: string,
) {
	if (Bun.env.NODE_ENV === "development" || Bun.env.NODE_ENV === "test") {
		return;
	}
	await resend.emails.send({
		from: "Planned Service <notifications@planned-service.com>",
		to: [to],
		subject,
		react: component,
	});
}
