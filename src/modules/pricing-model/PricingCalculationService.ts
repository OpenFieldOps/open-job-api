export abstract class PricingCalculationService {
	static calculatePriceWithModel(
		hours: number,
		baseRate: number,
		ranges: Array<{ hours: number; rate: number; position: number }>,
	): number {
		if (!ranges || ranges.length === 0) {
			return hours * baseRate;
		}

		const sortedRanges = [...ranges].sort((a, b) => a.position - b.position);

		let totalPrice = 0;
		let remainingHours = hours;

		for (let i = 0; i < sortedRanges.length; i++) {
			const range = sortedRanges[i];
			const hoursInThisRange = Math.min(remainingHours, range.hours);

			if (hoursInThisRange > 0) {
				totalPrice += hoursInThisRange * range.rate;
				remainingHours -= hoursInThisRange;
			}

			if (remainingHours <= 0) break;
		}

		if (remainingHours > 0) {
			totalPrice += remainingHours * baseRate;
		}

		return totalPrice;
	}

	static calculateJobHours(startDate: string, endDate: string): number {
		const start = new Date(startDate);
		const end = new Date(endDate);

		const diffMs = end.getTime() - start.getTime();
		const diffHours = diffMs / (1000 * 60 * 60);

		return Math.max(diffHours, 0.5);
	}
}
