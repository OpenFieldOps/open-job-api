import {
	Button,
	Container,
	Heading,
	Link,
	Tailwind,
	Text,
} from "@react-email/components";

type InvoiceEmailProps = {
	invoiceDownloadLink: string;
	from: Date;
	to: Date;
};

export default function InvoiceEmail({
	invoiceDownloadLink,
	from,
	to,
}: InvoiceEmailProps) {
	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat("fr-FR", {
			year: "numeric",
			month: "long",
			day: "numeric",
		}).format(date);
	};

	return (
		<Tailwind>
			<Container className="max-w-md mx-auto p-6 border border-gray-200 rounded-md font-sans">
				<Heading className="text-center text-2xl font-bold">
					Your Invoice is Ready
				</Heading>
				<Text className="text-center text-gray-600">
					Invoice period: {formatDate(from)} - {formatDate(to)}
				</Text>
				<Text className="text-center">
					<br />
					Your invoice for the specified period is now available for download.
					Click the button below to access your invoice.
				</Text>

				<div className="text-center mb-4">
					<Button
						className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md"
						href={invoiceDownloadLink}
					>
						Download Invoice
					</Button>
				</div>

				<Link
					className="text-center text-sm text-gray-500"
					href={invoiceDownloadLink}
				>
					{invoiceDownloadLink}
				</Link>
			</Container>
		</Tailwind>
	);
}

InvoiceEmail.PreviewProps = {
	invoiceDownloadLink: "https://planned-service.com/invoice.pdf",
	from: new Date("2024-01-01"),
	to: new Date("2024-01-31"),
};
