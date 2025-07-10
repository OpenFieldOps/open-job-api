import { AuthModel } from "../src/modules/auth/model";
import { AuthService } from "../src/modules/auth/service";
import { db } from "../src/services/db/db";
import { fileTable } from "../src/services/db/schema";

const dummyUser = {
  email: "suleyman@gmail.com",
  username: "suleyman",
  password: "suleyman123",
  firstName: "Suleyman",
  lastName: "Laarabi",
};

async function createDummyData() {
  await db
    .insert(fileTable)
    .values({
      fileName: "default-avatar.png",
    })
    .execute();
  const user = (await AuthService.registerUserAdmin(
    dummyUser
  )) as typeof AuthModel.AuthenticatedUserSuccessResponse.static;

  console.log("dummy user token:\n", user.token);
}

createDummyData()
  .then(() => console.log("Dummy data created successfully"))
  .catch((error) => console.error("Error creating dummy data:", error));
