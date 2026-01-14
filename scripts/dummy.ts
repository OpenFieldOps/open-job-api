import type { AuthModel } from "../src/modules/auth/AuthModel";
import { AuthService } from "../src/modules/auth/AuthService";
import "../src/services/db/db";

const generateUniqueId = () =>
  `${Date.now()}-${Math.random().toString(36).substring(7)}`;

export const dummyUser = {
  email: "dummy@gmail.com",
  username: "dummy",
  password: "password",
  firstName: "dummy",
  lastName: "dummy",
  phone: "+1234567890",
};

export const dummyOperatorUser = {
  email: "operator@gmail.com",
  username: "operator",
  password: "password",
  firstName: "operator",
  lastName: "operator",
  phone: "+1234567891",
};

export const dummySecondaryUser = {
  email: "dummy2@gmail.com",
  username: "dummy2",
  password: "password",
  firstName: "dummy2",
  lastName: "dummy2",
  phone: "+1234567892",
};

export const dummySecondaryOperatorUser = {
  email: "operator2@gmail.com",
  username: "operator2",
  password: "password",
  firstName: "operator2",
  lastName: "operator2",
  phone: "+1234567893",
};

export async function createDummyData() {
  const uniqueId = generateUniqueId();
  const uniqueDummyUser = {
    ...dummyUser,
    email: `dummy-${uniqueId}@gmail.com`,
    username: `dummy-${uniqueId}`,
  };
  const uniqueOperatorUser = {
    ...dummyOperatorUser,
    email: `operator-${uniqueId}@gmail.com`,
    username: `operator-${uniqueId}`,
  };

  const res = await AuthService.registerUserAdmin(uniqueDummyUser);

  if (!res || typeof res !== "object" || !("user" in res)) {
    throw new Error(`Failed to register admin user: ${JSON.stringify(res)}`);
  }

  await AuthService.registerUser(uniqueOperatorUser, "operator", res.user.id);

  const operatorAuth = (await AuthService.loginUser({
    email: uniqueOperatorUser.email,
    password: uniqueOperatorUser.password,
  })) as AuthModel.AuthenticatedUserSuccessResponse;

  return {
    admin: res,
    operator: operatorAuth,
  };
}

export async function createSecondaryDummyData() {
  const uniqueId = generateUniqueId();
  const uniqueSecondaryUser = {
    ...dummySecondaryUser,
    email: `dummy2-${uniqueId}@gmail.com`,
    username: `dummy2-${uniqueId}`,
  };
  const uniqueSecondaryOperatorUser = {
    ...dummySecondaryOperatorUser,
    email: `operator2-${uniqueId}@gmail.com`,
    username: `operator2-${uniqueId}`,
  };

  const res = await AuthService.registerUserAdmin(uniqueSecondaryUser);

  if (!res || typeof res !== "object" || !("user" in res)) {
    throw new Error(
      `Failed to register secondary admin user: ${JSON.stringify(res)}`
    );
  }

  await AuthService.registerUser(
    uniqueSecondaryOperatorUser,
    "operator",
    res.user.id
  );

  const operatorAuth = (await AuthService.loginUser({
    email: uniqueSecondaryOperatorUser.email,
    password: uniqueSecondaryOperatorUser.password,
  })) as AuthModel.AuthenticatedUserSuccessResponse;

  return {
    admin: res,
    operator: operatorAuth,
  };
}

if (require.main === module) {
  (async () => {
    try {
      // Create dummy user
      const dummyResult = await AuthService.registerUserAdmin(dummyUser);
      if (
        !dummyResult ||
        typeof dummyResult !== "object" ||
        !("user" in dummyResult)
      ) {
        throw new Error(
          `Failed to register dummy user: ${JSON.stringify(dummyResult)}`
        );
      }

      // Create operator associated with dummy user
      await AuthService.registerUser(
        dummyOperatorUser,
        "operator",
        dummyResult.user.id
      );

      console.log("Dummy data created successfully");
    } catch (error) {
      console.error("Error creating dummy data:", error);
    }
  })();
}
