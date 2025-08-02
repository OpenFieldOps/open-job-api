import { treaty } from "@elysiajs/eden";
import { sleep } from "bun";
import dayjs from "dayjs";
import type { App } from "../src/main";
import { db } from "../src/services/db/db";

function getAdminUser(userCount: number) {
  return {
    email: `stresstest${userCount}@gmail.com`,
    username: `stressadmin${userCount}`,
    password: "password",
    firstName: "Stress",
    lastName: "Admin",
  };
}
const client = treaty<App>("http://localhost:4000");

async function launchUserStressTest(userCount: number): Promise<void> {
  await db.$client.close();
  const user = getAdminUser(userCount);

  const authClient = await client.auth.login.post({
    email: user.email,
    password: user.password,
  });
  if (!authClient.data) {
    console.error("Failed to authenticate user:", user.email);
    return;
  }
  const authHeader = {
    authorization: authClient.data.token,
  };

  while (true) {
    await client.job.get({
      query: {
        start: dayjs().subtract(1, "day").toISOString(),
        end: dayjs().add(6, "day").toISOString(),
      },
    });

    await client.job.post(
      {
        title: `Stress Test Job for User ${userCount}`,
        description: "This is a stress test job.",
        assignedTo: userCount,
        startDate: dayjs().add(1, "day").toISOString(),
        endDate: dayjs().add(2, "day").toISOString(),
      },
      {
        headers: authHeader,
      }
    );

    await sleep(2000);
  }
}

if (require.main === module) {
  const i = Bun.argv[2] ? parseInt(Bun.argv[2], 10) : 1;
  console.log("Creating stress data", i);
  await launchUserStressTest(i)
    .then(() => {})
    .catch(() => {});
}
