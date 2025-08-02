import dayjs from "dayjs";
import type { AuthModel } from "../src/modules/auth/model";
import { AuthService } from "../src/modules/auth/service";
import type { JobModel } from "../src/modules/job/model";
import { JobService } from "../src/modules/job/service";
import type { UserModel } from "../src/modules/user/model";

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
    .subtract(40, "day")
    .startOf("day")
    .set("hour", 8)
    .toDate();

  for (let i = 0; i < 20; i++) {
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
        "user",
        adminId
      )) as UserModel.UserInfo;
      for (let jobIndex = 0; jobIndex < 70; jobIndex++) {
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

        await JobService.createJob(job, adminId);
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
