import { describe, expect, it } from "bun:test";
import dayjs from "dayjs";
import { createDummyData, createSecondaryDummyData } from "../../scripts/dummy";
import type { AuthModel } from "../modules/auth/AuthModel";
import type { JobModel } from "../modules/job/JobModel";
import { api } from "./setup";
import { userHeader } from "./utils";

const defaultJobDate = {
  start: dayjs().startOf("day").set("hour", 8),
  end: dayjs().startOf("day").set("hour", 14),
};

const defaultJobData = {
  title: "Good job",
};

async function createDefaultJob(
  admin: AuthModel.AuthenticatedUserSuccessResponse
) {
  return await api.job.post(
    {
      ...defaultJobData,
      startDate: defaultJobDate.start.toISOString(),
      endDate: defaultJobDate.end.toISOString(),
      assignedTo: admin.user.id,
      assignedClient: admin.user.id,
    },
    userHeader(admin.token)
  );
}

async function fetchUserJobs(
  admin: AuthModel.AuthenticatedUserSuccessResponse
) {
  return (
    await api.job.get({
      query: {
        start: defaultJobDate.start.clone().startOf("day").toISOString(),
        end: defaultJobDate.end.clone().endOf("day").toISOString(),
      },
      ...userHeader(admin.token),
    })
  ).data as JobModel.Job[];
}

describe("Jobs Tests", () => {
  it("should create an job", async () => {
    const dummy = await createDummyData();
    const job_res = await api.job.post(
      {
        ...defaultJobData,
        assignedTo: dummy.admin.user.id,
        assignedClient: dummy.admin.user.id,
      },
      userHeader(dummy.admin.token)
    );

    expect(job_res.status).toBe(200);
    expect(job_res.data).toHaveProperty("id");
  });

  it("should fetch jobs", async () => {
    const dummy = await createDummyData();
    await createDefaultJob(dummy.admin);

    const job_res = await api.job.get({
      query: {
        start: defaultJobDate.start.clone().startOf("day").toISOString(),
        end: defaultJobDate.end.clone().endOf("day").toISOString(),
      },
      ...userHeader(dummy.admin.token),
    });

    expect(job_res.status).toBe(200);
    expect(job_res.data).toBeArray();
    expect(job_res.data).toHaveLength(1);
  });

  it("should update a job", async () => {
    const dummy = await createDummyData();
    const job = (await createDefaultJob(dummy.admin)).data as JobModel.Job;

    const job_res = await api.job.patch(
      {
        id: job.id,
        title: "New Title",
      },
      userHeader(dummy.admin.token)
    );

    expect(job_res.status).toBe(200);

    const fetched_job = (await fetchUserJobs(dummy.admin)).pop();

    expect(fetched_job?.title).toBe("New Title");
  });

  it("should delete a job", async () => {
    const dummy = await createDummyData();
    const job = (await createDefaultJob(dummy.admin)).data as JobModel.Job;

    const res = await api
      .job({
        id: job.id,
      })
      .delete(undefined, userHeader(dummy.admin.token));

    expect(res.status).toBe(200);
    const fetched_job = await fetchUserJobs(dummy.admin);
    expect(fetched_job).toHaveLength(0);
  });

  it("should not allow delete a job if not created by user", async () => {
    const dummy = await createDummyData();
    const job = (await createDefaultJob(dummy.admin)).data as JobModel.Job;
    const secondaryDummy = await createSecondaryDummyData();
    const res = await api
      .job({
        id: job.id,
      })
      .delete(undefined, userHeader(secondaryDummy.admin.token));
    expect(res.status).toBe(404);
  });

  it("should create a job document", async () => {
    const dummy = await createDummyData();
    const job = (await createDefaultJob(dummy.admin)).data as JobModel.Job;

    const res = await api.job.documents({ jobId: job.id }).post(
      {
        file: new File(["test content"], "test.txt"),
      },
      userHeader(dummy.admin.token)
    );

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("id");
    expect(res.data).toHaveProperty("fileName");
  });

  it("should fetch job documents", async () => {
    const dummy = await createDummyData();
    const job = (await createDefaultJob(dummy.admin)).data as JobModel.Job;

    const doc_res = await api.job
      .documents({ jobId: job.id })
      .get(userHeader(dummy.admin.token));

    expect(doc_res.status).toBe(200);
    expect(doc_res.data).toBeArray();
  });

  it("should delete a job document", async () => {
    const dummy = await createDummyData();
    const job = (await createDefaultJob(dummy.admin)).data as JobModel.Job;

    const doc_res = await api.job.documents({ jobId: job.id }).post(
      {
        file: new File(["test content"], "test.txt"),
      },
      userHeader(dummy.admin.token)
    );

    expect(doc_res.status).toBe(200);
    expect(doc_res.data).toHaveProperty("id");

    const delete_res = await api.job["delete-document"].delete(
      {
        jobId: job.id,
        fileId: doc_res.data?.id as string,
      },
      userHeader(dummy.admin.token)
    );

    expect(delete_res.status).toBe(200);

    const fetch_res = await api.job
      .documents({ jobId: job.id })
      .get(userHeader(dummy.admin.token));
    expect(fetch_res.status).toBe(200);
    expect(fetch_res.data).toBeArray();
    expect(fetch_res.data).toHaveLength(0);
  });

  it("should filter jobs by operator ID", async () => {
    const dummy = await createDummyData();
    const secondaryDummy = await createSecondaryDummyData();

    const job1 = await api.job.post(
      {
        ...defaultJobData,
        title: "Job for main operator",
        startDate: defaultJobDate.start.toISOString(),
        endDate: defaultJobDate.end.toISOString(),
        assignedTo: dummy.admin.user.id,
        assignedClient: dummy.admin.user.id,
      },
      userHeader(dummy.admin.token)
    );

    const job2 = await api.job.post(
      {
        ...defaultJobData,
        title: "Job for secondary operator",
        startDate: defaultJobDate.start.toISOString(),
        endDate: defaultJobDate.end.toISOString(),
        assignedTo: secondaryDummy.operator.user.id,
        assignedClient: secondaryDummy.operator.user.id,
      },
      userHeader(secondaryDummy.admin.token)
    );

    expect(job1.status).toBe(200);
    expect(job2.status).toBe(200);

    const jobsForMainOperator = await api.job.get({
      query: {
        start: defaultJobDate.start.clone().startOf("day").toISOString(),
        end: defaultJobDate.end.clone().endOf("day").toISOString(),
        operatorId: dummy.admin.user.id,
      },
      ...userHeader(dummy.admin.token),
    });

    expect(jobsForMainOperator.status).toBe(200);
    expect(jobsForMainOperator.data).toBeArray();
    expect(jobsForMainOperator.data).toHaveLength(1);
    expect(jobsForMainOperator.data?.[0]).toHaveProperty(
      "assignedTo",
      dummy.admin.user.id
    );

    const jobsForSecondaryOperator = await api.job.get({
      query: {
        start: defaultJobDate.start.clone().startOf("day").toISOString(),
        end: defaultJobDate.end.clone().endOf("day").toISOString(),
        operatorId: secondaryDummy.operator.user.id,
      },
      ...userHeader(dummy.admin.token),
    });

    expect(jobsForSecondaryOperator.status).toBe(200);
    expect(jobsForSecondaryOperator.data).toBeArray();
    expect(jobsForSecondaryOperator.data).toHaveLength(1);
    expect(jobsForSecondaryOperator.data?.[0]).toHaveProperty(
      "assignedTo",
      secondaryDummy.operator.user.id
    );
  });

  it("should create a job report", async () => {
    const dummy = await createDummyData();
    const job = (await createDefaultJob(dummy.admin)).data as JobModel.Job;

    const reportRes = await api.job.report.post(
      {
        jobId: job.id,
        signature: new File(["signature content"], "signature.png", {
          type: "image/png",
        }),
        description: "Job completed successfully",
      },
      userHeader(dummy.admin.token)
    );

    expect(reportRes.status).toBe(200);
    expect(reportRes.data).toHaveProperty("id");
    expect(reportRes.data).toHaveProperty("signature");
    expect(reportRes.data).toHaveProperty(
      "description",
      "Job completed successfully"
    );
  });
});
