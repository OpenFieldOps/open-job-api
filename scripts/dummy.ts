import type { AuthModel } from "../src/modules/auth/model";
import { AuthService } from "../src/modules/auth/service";

export const dummyUser = {
  email: "dummy@gmail.com",
  username: "dummy",
  password: "password",
  firstName: "dummy",
  lastName: "dummy",
};

export const dummyOperatorUser = {
  email: "operator@gmail.com",
  username: "operator",
  password: "password",
  firstName: "operator",
  lastName: "operator",
};

export const dummySecondaryUser = {
  email: "dummy2@gmail.com",
  username: "dummy2",
  password: "password",
  firstName: "dummy2",
  lastName: "dummy2",
};

export const dummySecondaryOperatorUser = {
  email: "operator2@gmail.com",
  username: "operator2",
  password: "password",
  firstName: "operator2",
  lastName: "operator2",
};

export async function createDummyData() {
  const res = (await AuthService.registerUserAdmin(
    dummyUser
  )) as AuthModel.AuthenticatedUserSuccessResponse;

  await AuthService.registerUser(dummyOperatorUser, "operator", res.user.id);

  const operatorAuth = (await AuthService.loginUser({
    email: dummyOperatorUser.email,
    password: dummyOperatorUser.password,
  })) as AuthModel.AuthenticatedUserSuccessResponse;

  return {
    admin: res,
    operator: operatorAuth,
  };
}

export async function createSecondaryDummyData() {
  const res = (await AuthService.registerUserAdmin(
    dummySecondaryUser
  )) as AuthModel.AuthenticatedUserSuccessResponse;

  await AuthService.registerUser(
    dummySecondaryOperatorUser,
    "operator",
    res.user.id
  );

  const operatorAuth = (await AuthService.loginUser({
    email: dummySecondaryOperatorUser.email,
    password: dummySecondaryOperatorUser.password,
  })) as AuthModel.AuthenticatedUserSuccessResponse;

  return {
    admin: res,
    operator: operatorAuth,
  };
}

if (require.main === module) {
  await createDummyData()
    .then(() => console.log("Dummy data created successfully"))
    .catch((error) => console.error("Error creating dummy data:", error));
}
