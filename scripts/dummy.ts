import { AuthModel } from "../src/modules/auth/model";
import { AuthService } from "../src/modules/auth/service";
import { db } from "../src/services/db/db";
import { fileTable } from "../src/services/db/schema";

export const dummyUser = {
  email: "suleyman@gmail.com",
  username: "suleyman",
  password: "suleyman123",
  firstName: "Suleyman",
  lastName: "Laarabi",
};

export async function createMinimalData() {
  await db
    .insert(fileTable)
    .values({
      fileName: "default-avatar.png",
    })
    .execute();
}

export async function createDummyData() {
  await createMinimalData();
  const user = (await AuthService.registerUserAdmin(
    dummyUser
  )) as typeof AuthModel.AuthenticatedUserSuccessResponse.static;

  return user;
}

if (require.main === module) {
  await createDummyData()
    .then(() => console.log("Dummy data created successfully"))
    .catch((error) => console.error("Error creating dummy data:", error));
}
