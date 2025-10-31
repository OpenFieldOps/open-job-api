import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "../../../services/db/db";
import { jobTable } from "../../../services/db/schema";
import {
  pricingModelTable,
  pricingRangeTable,
} from "../../../services/db/schema/tables/pricing";
import { userTable } from "../../../services/db/schema/tables/users";
import { PricingCalculationService } from "../../pricing-model/PricingCalculationService";

interface DailyIncome {
  date: string;
  income: number;
  jobs: Array<{
    jobId: number;
    title: string;
    hours: number;
    amount: number;
    clientName?: string;
  }>;
}

export abstract class JobIncomeService {
  static async getDailyIncome(
    userId: number,
    startDate: string,
    endDate: string
  ): Promise<DailyIncome[]> {
    const startDateOnly = startDate.split("T")[0];
    const endDateOnly = endDate.split("T")[0];

    const queryStartDate = `${startDateOnly}T00:00:00.000Z`;
    const queryEndDate = `${endDateOnly}T23:59:59.999Z`;

    const jobs = await db
      .select({
        job: jobTable,
        client: userTable,
        pricingModel: pricingModelTable,
      })
      .from(jobTable)
      .leftJoin(userTable, eq(jobTable.assignedClient, userTable.id))
      .leftJoin(
        pricingModelTable,
        eq(userTable.pricingModel, pricingModelTable.id)
      )
      .where(
        and(
          eq(jobTable.createdBy, userId),
          lte(jobTable.startDate, queryEndDate),
          gte(jobTable.endDate, queryStartDate)
        )
      );

    const pricingModelIds = [
      ...new Set(
        jobs
          .map((j) => j.pricingModel?.id)
          .filter((id): id is number => id !== null && id !== undefined)
      ),
    ];

    let allRanges: Array<{
      id: number;
      pricingModelId: number;
      hours: number;
      rate: number;
      position: number;
    }> = [];

    if (pricingModelIds.length > 0) {
      allRanges = await db
        .select()
        .from(pricingRangeTable)
        .where(inArray(pricingRangeTable.pricingModelId, pricingModelIds));
    }

    const rangesByPricingModel = new Map<number, typeof allRanges>();
    for (const range of allRanges) {
      const existingRanges =
        rangesByPricingModel.get(range.pricingModelId) || [];
      rangesByPricingModel.set(range.pricingModelId, [
        ...existingRanges,
        range,
      ]);
    }

    const jobsByDay = new Map<string, typeof jobs>();

    for (const jobData of jobs) {
      const jobStart = new Date(jobData.job.startDate);
      const jobEnd = new Date(jobData.job.endDate);

      const currentDate = new Date(jobStart);
      while (currentDate <= jobEnd) {
        const dateKey = currentDate.toISOString().split("T")[0];
        const existing = jobsByDay.get(dateKey) || [];
        jobsByDay.set(dateKey, [...existing, jobData]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const dailyIncomes: DailyIncome[] = [];

    const start = new Date(`${startDateOnly}T00:00:00.000Z`);
    const end = new Date(`${endDateOnly}T23:59:59.999Z`);
    const currentDay = new Date(start);

    while (currentDay <= end) {
      const dateKey = currentDay.toISOString().split("T")[0] as string;
      const dayJobs = jobsByDay.get(dateKey) || [];

      let dayIncome = 0;
      const jobDetails: DailyIncome["jobs"] = [];

      for (const jobData of dayJobs) {
        const { job, client, pricingModel } = jobData;

        const hours = PricingCalculationService.calculateJobHours(
          job.startDate,
          job.endDate
        );

        const jobStart = new Date(job.startDate);
        const jobEnd = new Date(job.endDate);
        const jobDays = Math.max(
          1,
          Math.ceil(
            (jobEnd.getTime() - jobStart.getTime()) / (1000 * 60 * 60 * 24)
          )
        );

        const hoursPerDay = hours / jobDays;

        let amount = 0;

        if (pricingModel) {
          const ranges = rangesByPricingModel.get(pricingModel.id) || [];
          amount = PricingCalculationService.calculatePriceWithModel(
            hoursPerDay,
            pricingModel.baseRate,
            ranges
          );
        } else {
          amount = 0;
        }

        dayIncome += amount;
        jobDetails.push({
          jobId: job.id,
          title: job.title,
          hours: hoursPerDay,
          amount,
          clientName: client
            ? `${client.firstName} ${client.lastName}`
            : undefined,
        });
      }

      dailyIncomes.push({
        date: dateKey,
        income: dayIncome,
        jobs: jobDetails,
      });

      currentDay.setDate(currentDay.getDate() + 1);
    }

    return dailyIncomes;
  }
}
