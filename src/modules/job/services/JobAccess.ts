import { and, eq, or } from "drizzle-orm";
import { db } from "../../../services/db/db";
import { jobOperatorTable, jobTable } from "../../../services/db/schema";

export function userJobAccessSubquery(jobId: number, userId: number) {
  return db
    .select({ id: jobTable.id })
    .from(jobTable)
    .leftJoin(jobOperatorTable, eq(jobTable.id, jobOperatorTable.jobId))
    .where(
      and(
        eq(jobTable.id, jobId),
        or(
          eq(jobTable.createdBy, userId),
          eq(jobOperatorTable.operatorId, userId)
        )
      )
    );
}
