import { and, eq } from "drizzle-orm";
import { db } from "../../../services/db/db";
import { jobOperatorTable, jobTable } from "../../../services/db/schema";

export async function userJobAccessCondition(userId: number, jobId: number) {
  const operatorAssignment = await db
    .select()
    .from(jobOperatorTable)
    .where(
      and(
        eq(jobOperatorTable.jobId, jobId),
        eq(jobOperatorTable.operatorId, userId)
      )
    )
    .limit(1);

  const isOperator = operatorAssignment.length > 0;
  const isCreator = await db
    .select()
    .from(jobTable)
    .where(and(eq(jobTable.id, jobId), eq(jobTable.createdBy, userId)))
    .limit(1);

  return isOperator || isCreator.length > 0;
}
