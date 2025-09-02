import dayjs from "dayjs";
import type { AuthModel } from "../src/modules/auth/model";
import { AuthService } from "../src/modules/auth/service";
import type { JobModel } from "../src/modules/job/model";
import { UserNotificationModel } from "../src/modules/notification/model";
import { UserNotificationSerice } from "../src/modules/notification/service";
import type { UserModel } from "../src/modules/user/model";
import { JobService } from "../src/modules/job/services/job.service";

export async function createDummyStressData(userCount: number) {
  const adminResponse = (await AuthService.registerUserAdmin({
    email: `stresstest${userCount}@gmail.com`,
    username: `stressadmin${userCount}`,
    password: "password",
    firstName: "Stress",
    lastName: "Admin",
  })) as AuthModel.AuthenticatedUserSuccessResponse;

  const adminId = adminResponse.user.id;

  const startDate = dayjs()
    .subtract(20, "day")
    .startOf("day")
    .set("hour", 8)
    .toDate();

  for (let i = 0; i < 45; i++) {
    const operatorUser = {
      email: `operator_${userCount}_${i}@gmail.com`,
      username: `operator_${userCount}_${i}`,
      password: "password",
      firstName: `Operator_${userCount}_${i}`,
      lastName: `User_${userCount}_${i}`,
    };

    try {
      const operator = (await AuthService.registerUser(
        operatorUser,
        "operator",
        adminId
      )) as UserModel.UserInfo;
      for (let jobIndex = 0; jobIndex < 30; jobIndex++) {
        const job: JobModel.JobCreateBody = {
          title: `Stress Test Job ${jobIndex} for Operator ${userCount}_${jobIndex}`,
          description: `This is a stress test job for operator ${userCount}_${jobIndex}.`,
          assignedTo: operator.id,
          startDate: dayjs(startDate)
            .add(jobIndex, "day")
            .add(i * 3, "hour")
            .toISOString(),
          endDate: dayjs(startDate)
            .add(jobIndex, "day")
            .add(3 + i * 3, "hour")
            .toISOString(),
        };

        const jobRes = (await JobService.createJob(job, adminId))
          .response as JobModel.Job;
        await UserNotificationSerice.sendNotification(adminId, {
          title: `New Job Created for Operator ${userCount}_${i}`,
          message: `A new job has been created for operator ${operatorUser.username}.`,
          type: UserNotificationModel.UserNotificationType.JobAssigned,
          payload: {
            jobId: jobRes.id,
          },
        });
      }
    } catch (error) {
      console.error(`Failed to create operator ${i}:`, error);
    }
  }

  console.log("Successfully created admin with operators");
}
if (require.main === module) {
  const i = Bun.argv[2] ? parseInt(Bun.argv[2], 10) : 1;
  console.log("Creating stress data", i);
  await createDummyStressData(i)
    .then(() => {
      console.log("Stress data created successfully for all users");
    })
    .catch((error) => {
      console.error("Error creating stress data:", error);
    });
}
