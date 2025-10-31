export abstract class PricingCalculationService {
  static calculatePriceWithModel(
    hours: number,
    baseRate: number,
    ranges: Array<{ hours: number; rate: number; position: number }>
  ): number {
    if (!ranges || ranges.length === 0) {
      return hours * baseRate;
    }

    const sortedRanges = [...ranges].sort((a, b) => a.position - b.position);

    let totalPrice = 0;
    let remainingHours = hours;
    let previousThreshold = 0;

    for (let i = 0; i < sortedRanges.length; i++) {
      const range = sortedRanges[i];
      const currentThreshold = range.hours;
      const hoursInThisRange = Math.min(
        remainingHours,
        currentThreshold - previousThreshold
      );

      if (hoursInThisRange > 0) {
        totalPrice += hoursInThisRange * range.rate;
        remainingHours -= hoursInThisRange;
      }

      previousThreshold = currentThreshold;

      if (remainingHours <= 0) break;
    }

    if (remainingHours > 0 && sortedRanges.length > 0) {
      const lastRate = sortedRanges[sortedRanges.length - 1].rate;
      totalPrice += remainingHours * lastRate;
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
