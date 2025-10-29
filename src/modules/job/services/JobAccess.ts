import { and, eq, or } from "drizzle-orm";
import { db } from "../../../services/db/db";
import { jobTable } from "../../../services/db/schema";

export function userJobAccessCondition(userId: number, jobId: number) {
  return and(
    eq(jobTable.id, jobId),
    or(eq(jobTable.assignedTo, userId), eq(jobTable.createdBy, userId))
  );
}

export function withUserJob(userId: number, jobId: number) {
  return db
    .$with("job")
    .as(
      db.select().from(jobTable).where(userJobAccessCondition(userId, jobId))
    );
}
