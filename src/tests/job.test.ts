import { describe, expect, it } from "bun:test";
import dayjs from "dayjs";
import { createDummyData, createSecondaryDummyData } from "../../scripts/dummy";
import type { AuthModel } from "../modules/auth/AuthModel";
import type { ChatModel } from "../modules/chat/ChatModel";
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
  admin: AuthModel.AuthenticatedUserSuccessResponse,
  operatorIds?: number[]
) {
  return await api.job.post(
    {
      ...defaultJobData,
      startDate: defaultJobDate.start.toISOString(),
      endDate: defaultJobDate.end.toISOString(),
      operatorIds: operatorIds || [admin.user.id],
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
        operatorIds: [dummy.operator.user.id],
        assignedClient: dummy.admin.user.id,
      },
      userHeader(dummy.admin.token)
    );

    expect(job_res.status).toBe(200);
    expect(job_res.data?.job).toHaveProperty("id");
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
    const job = (await createDefaultJob(dummy.admin)).data?.job as JobModel.Job;

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
    const job = (await createDefaultJob(dummy.admin)).data?.job as JobModel.Job;

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
    const job = (await createDefaultJob(dummy.admin)).data?.job as JobModel.Job;
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
    const job = (await createDefaultJob(dummy.admin)).data?.job as JobModel.Job;

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
    const job = (await createDefaultJob(dummy.admin)).data?.job as JobModel.Job;

    const doc_res = await api.job
      .documents({ jobId: job.id })
      .get(userHeader(dummy.admin.token));

    expect(doc_res.status).toBe(200);
    expect(doc_res.data).toBeArray();
  });

  it("should delete a job document", async () => {
    const dummy = await createDummyData();
    const job = (await createDefaultJob(dummy.admin)).data?.job as JobModel.Job;

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
        operatorIds: [dummy.operator.user.id],
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
        operatorIds: [secondaryDummy.operator.user.id],
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
        operatorId: dummy.operator.user.id,
      },
      ...userHeader(dummy.admin.token),
    });

    expect(jobsForMainOperator.status).toBe(200);
    expect(jobsForMainOperator.data).toBeArray();
    expect(jobsForMainOperator.data).toHaveLength(1);

    const jobsForSecondaryOperator = await api.job.get({
      query: {
        start: defaultJobDate.start.clone().startOf("day").toISOString(),
        end: defaultJobDate.end.clone().endOf("day").toISOString(),
        operatorId: secondaryDummy.operator.user.id,
      },
      ...userHeader(secondaryDummy.admin.token),
    });

    expect(jobsForSecondaryOperator.status).toBe(200);
    expect(jobsForSecondaryOperator.data).toBeArray();
    expect(jobsForSecondaryOperator.data).toHaveLength(1);
  });

  it("should create a job report", async () => {
    const dummy = await createDummyData();
    const job = (await createDefaultJob(dummy.admin)).data?.job as JobModel.Job;

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

  it("should create a chat when creating a job", async () => {
    const dummy = await createDummyData();

    const operator2Res = await api.user["create-user"].post(
      {
        email: "operator3@test.com",
        username: "operator3",
        password: "password",
        firstName: "Operator",
        lastName: "Three",
        phone: "+1234567894",
        role: "operator",
      },
      userHeader(dummy.admin.token)
    );

    expect(operator2Res.status).toBe(200);
    const operator2 = operator2Res.data as { id: number };

    const jobRes = await api.job.post(
      {
        ...defaultJobData,
        title: "Job with chat",
        startDate: defaultJobDate.start.toISOString(),
        endDate: defaultJobDate.end.toISOString(),
        operatorIds: [dummy.operator.user.id, operator2.id],
        assignedClient: dummy.admin.user.id,
      },
      userHeader(dummy.admin.token)
    );

    expect(jobRes.status).toBe(200);
    const job = jobRes.data?.job as JobModel.Job;

    const adminChatsRes = await api.chat.get(userHeader(dummy.admin.token));
    expect(adminChatsRes.status).toBe(200);

    const adminChats = adminChatsRes.data as ChatModel.ChatWithLastMessage[];
    expect(adminChats).toBeArray();
    expect(adminChats.length).toBeGreaterThanOrEqual(1);

    const jobChat = adminChats.find(
      (chat) => chat.name === `Job - ${job.title}`
    );
    expect(jobChat).toBeDefined();
    expect(jobChat?.name).toBe(`Job - ${job.title}`);

    const operatorChatsRes = await api.chat.get(
      userHeader(dummy.operator.token)
    );
    expect(operatorChatsRes.status).toBe(200);

    const operatorChats =
      operatorChatsRes.data as ChatModel.ChatWithLastMessage[];
    expect(operatorChats).toBeArray();
    expect(operatorChats.length).toBeGreaterThanOrEqual(1);

    const operatorJobChat = operatorChats.find(
      (chat) => chat.name === `Job - ${job.title}`
    );
    expect(operatorJobChat).toBeDefined();
  });

  it("should create a chat with only admin when creating job without operators", async () => {
    const dummy = await createDummyData();

    const jobRes = await api.job.post(
      {
        ...defaultJobData,
        title: "Solo job",
        startDate: defaultJobDate.start.toISOString(),
        endDate: defaultJobDate.end.toISOString(),
        operatorIds: [],
        assignedClient: dummy.admin.user.id,
      },
      userHeader(dummy.admin.token)
    );

    expect(jobRes.status).toBe(200);
    const job = jobRes.data?.job as JobModel.Job;

    const adminChatsRes = await api.chat.get(userHeader(dummy.admin.token));
    expect(adminChatsRes.status).toBe(200);

    const adminChats = adminChatsRes.data as ChatModel.ChatWithLastMessage[];
    expect(adminChats).toBeArray();
    expect(adminChats.length).toBe(3);
    const jobChat = adminChats.find((c) => c.name === `Job - ${job.title}`);
    expect(jobChat).toBeDefined();
  });

  it("should create a job task", async () => {
    const dummy = await createDummyData();
    const job = (await createDefaultJob(dummy.admin)).data?.job as JobModel.Job;

    const taskRes = await api.job.task.post(
      {
        jobId: job.id,
        title: "Test task",
        completed: false,
      },
      userHeader(dummy.admin.token)
    );

    expect(taskRes.status).toBe(200);
    expect(taskRes.data).toHaveProperty("id");
    expect(taskRes.data).toHaveProperty("title", "Test task");
    expect(taskRes.data).toHaveProperty("completed", false);
    expect(taskRes.data).toHaveProperty("jobId", job.id);
  });

  it("should get job tasks", async () => {
    const dummy = await createDummyData();
    const job = (await createDefaultJob(dummy.admin)).data?.job as JobModel.Job;

    await api.job.task.post(
      {
        jobId: job.id,
        title: "Task 1",
        completed: false,
      },
      userHeader(dummy.admin.token)
    );

    await api.job.task.post(
      {
        jobId: job.id,
        title: "Task 2",
        completed: true,
      },
      userHeader(dummy.admin.token)
    );

    const tasksRes = await api
      .job({ id: job.id })
      .task.get(userHeader(dummy.admin.token));

    expect(tasksRes.status).toBe(200);
    expect(tasksRes.data).toBeArray();
    expect(tasksRes.data).toHaveLength(2);
  });

  it("should update a job task", async () => {
    const dummy = await createDummyData();
    const job = (await createDefaultJob(dummy.admin)).data?.job as JobModel.Job;

    const taskRes = await api.job.task.post(
      {
        jobId: job.id,
        title: "Original title",
        completed: false,
      },
      userHeader(dummy.admin.token)
    );

    expect(taskRes.status).toBe(200);
    const task = taskRes.data as JobModel.JobTask;

    const updateRes = await api.job.task.patch(
      {
        id: task.id,
        jobId: job.id,
        title: "Updated title",
        completed: true,
      },
      userHeader(dummy.admin.token)
    );

    expect(updateRes.status).toBe(200);
    expect(updateRes.data).toBeArray();
    expect(updateRes.data?.[0]).toHaveProperty("title", "Updated title");
    expect(updateRes.data?.[0]).toHaveProperty("completed", true);
  });

  it("should delete a job task", async () => {
    const dummy = await createDummyData();
    const job = (await createDefaultJob(dummy.admin)).data?.job as JobModel.Job;

    const taskRes = await api.job.task.post(
      {
        jobId: job.id,
        title: "Task to delete",
        completed: false,
      },
      userHeader(dummy.admin.token)
    );

    expect(taskRes.status).toBe(200);
    const task = taskRes.data as JobModel.JobTask;

    const deleteRes = await api.job
      .task({ taskId: task.id })
      .delete(undefined, userHeader(dummy.admin.token));

    expect(deleteRes.status).toBe(200);

    const tasksRes = await api
      .job({ id: job.id })
      .task.get(userHeader(dummy.admin.token));

    expect(tasksRes.status).toBe(200);
    expect(tasksRes.data).toBeArray();
    expect(tasksRes.data).toHaveLength(0);
  });

  it("should not allow unauthorized user to access job tasks", async () => {
    const dummy = await createDummyData();
    const secondaryDummy = await createSecondaryDummyData();

    const job = (await createDefaultJob(dummy.admin)).data?.job as JobModel.Job;

    await api.job.task.post(
      {
        jobId: job.id,
        title: "Private task",
        completed: false,
      },
      userHeader(dummy.admin.token)
    );

    const tasksRes = await api
      .job({ id: job.id })
      .task.get(userHeader(secondaryDummy.admin.token));

    expect(tasksRes.status).toBe(200);
    expect(tasksRes.data).toBeArray();
    expect(tasksRes.data).toHaveLength(0);
  });

  it("should not allow unauthorized user to create job task", async () => {
    const dummy = await createDummyData();
    const secondaryDummy = await createSecondaryDummyData();

    const job = (await createDefaultJob(dummy.admin)).data?.job as JobModel.Job;

    const taskRes = await api.job.task.post(
      {
        jobId: job.id,
        title: "Unauthorized task",
        completed: false,
      },
      userHeader(secondaryDummy.admin.token)
    );

    expect(taskRes.status).toBe(401);
  });

  it("should not allow unauthorized user to update job task", async () => {
    const dummy = await createDummyData();
    const secondaryDummy = await createSecondaryDummyData();

    const job = (await createDefaultJob(dummy.admin)).data?.job as JobModel.Job;

    const taskRes = await api.job.task.post(
      {
        jobId: job.id,
        title: "Task to protect",
        completed: false,
      },
      userHeader(dummy.admin.token)
    );

    expect(taskRes.status).toBe(200);
    const task = taskRes.data as JobModel.JobTask;

    const updateRes = await api.job.task.patch(
      {
        id: task.id,
        jobId: job.id,
        title: "Hacked",
        completed: true,
      },
      userHeader(secondaryDummy.admin.token)
    );

    expect(updateRes.status).toBe(404);

    const tasksCheck = await api
      .job({ id: job.id })
      .task.get(userHeader(dummy.admin.token));
    expect(tasksCheck.data).toHaveLength(1);
    expect((tasksCheck.data as JobModel.JobTask[])[0].title).toBe(
      "Task to protect"
    );
    expect((tasksCheck.data as JobModel.JobTask[])[0].completed).toBe(false);
  });

  it("should not allow unauthorized user to delete job task", async () => {
    const dummy = await createDummyData();
    const secondaryDummy = await createSecondaryDummyData();

    const job = (await createDefaultJob(dummy.admin)).data?.job as JobModel.Job;

    const taskRes = await api.job.task.post(
      {
        jobId: job.id,
        title: "Task to protect",
        completed: false,
      },
      userHeader(dummy.admin.token)
    );

    expect(taskRes.status).toBe(200);
    const task = taskRes.data as JobModel.JobTask;

    const deleteRes = await api.job
      .task({ taskId: task.id })
      .delete(undefined, userHeader(secondaryDummy.admin.token));

    expect(deleteRes.status).toBe(404);

    const tasksCheck = await api
      .job({ id: job.id })
      .task.get(userHeader(dummy.admin.token));
    expect(tasksCheck.data).toHaveLength(1);
  });

  it("should allow operator to manage tasks for assigned job", async () => {
    const dummy = await createDummyData();
    const job = (await createDefaultJob(dummy.admin, [dummy.operator.user.id]))
      .data?.job as JobModel.Job;

    const taskRes = await api.job.task.post(
      {
        jobId: job.id,
        title: "Operator task",
        completed: false,
      },
      userHeader(dummy.operator.token)
    );

    expect(taskRes.status).toBe(200);
    const task = taskRes.data as JobModel.JobTask;

    const updateRes = await api.job.task.patch(
      {
        id: task.id,
        jobId: job.id,
        title: "Updated by operator",
        completed: true,
      },
      userHeader(dummy.operator.token)
    );

    expect(updateRes.status).toBe(200);
    expect(updateRes.data).toBeArray();
    expect(updateRes.data?.[0]).toHaveProperty("completed", true);
    expect(updateRes.data?.[0]).toHaveProperty("title", "Updated by operator");

    const deleteRes = await api.job
      .task({ taskId: task.id })
      .delete(undefined, userHeader(dummy.operator.token));

    expect(deleteRes.status).toBe(200);

    const tasksCheck = await api
      .job({ id: job.id })
      .task.get(userHeader(dummy.operator.token));
    expect(tasksCheck.data).toHaveLength(0);
  });
});
