import { eq } from "drizzle-orm";
import { jwtPlugin } from "../src/modules/auth/macro";
import { db } from "../src/services/db/db";
import { fileTable, userTable } from "../src/services/db/schema";

const dummyUser = {
  email: "suleyman@gmail.com",
  username: "suleyman",
  password: await Bun.password.hash("suleyman123", "argon2d"),
  firstName: "Suleyman",
  lastName: "Laarabi",
};

async function createDummyData() {
  const existingUser = (
    await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, dummyUser.email))
      .execute()
  ).pop();

  if (existingUser) {
    await db
      .delete(userTable)
      .where(eq(userTable.id, existingUser.id))
      .execute();
  }

  await db
    .insert(fileTable)
    .values({
      fileName: "default-avatar.png",
    })
    .execute();
  await db.insert(userTable).values(dummyUser).execute();
  delete (dummyUser as any).password;
  const token = await jwtPlugin.decorator.jwt.sign(dummyUser);

  console.log("dummy user token:\n", token);
}

createDummyData()
  .then(() => console.log("Dummy data created successfully"))
  .catch((error) => console.error("Error creating dummy data:", error));
