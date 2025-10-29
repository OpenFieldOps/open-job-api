import { describe, expect, it } from "bun:test";
import { createDummyData, createSecondaryDummyData } from "../../scripts/dummy";
import type { UserModel } from "../modules/user/UserModel";
import { api } from "./setup";
import { userHeader } from "./utils";

const testUserData = {
  firstName: "Updated",
  lastName: "User",
  phone: "+33123456789",
};

const newUserData = {
  email: "newuser@example.com",
  firstName: "New",
  lastName: "User",
  password: "password123",
  username: "newuser",
  role: "operator",
} as const;

const testLocation = {
  latitude: 48.8566,
  longitude: 2.3522,
};

describe("User Tests", () => {
  it("should update user information", async () => {
    const dummy = await createDummyData();

    const res = await api.user.patch(
      testUserData,
      userHeader(dummy.admin.token)
    );

    expect(res.status).toBe(200);
  });

  it("should update user avatar", async () => {
    const dummy = await createDummyData();

    const res = await api.user.avatar.patch(
      {
        file: new File(["avatar content"], "avatar.jpg", {
          type: "image/jpeg",
        }),
      },
      userHeader(dummy.admin.token)
    );

    expect(res.status).toBe(200);
    expect(res.data).toBeString();
  });

  it("should get user avatar URL", async () => {
    const dummy = await createDummyData();

    const res = await api.user.avatar.get(userHeader(dummy.admin.token));

    expect(res.status).toBe(200);
  });

  it("should create assigned user", async () => {
    const dummy = await createDummyData();

    const res = await api.user["create-user"].post(
      newUserData,
      userHeader(dummy.admin.token)
    );

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("id");
    expect(res.data).toHaveProperty("email", newUserData.email);
    expect(res.data).toHaveProperty("firstName", newUserData.firstName);
    expect(res.data).toHaveProperty("lastName", newUserData.lastName);
  });

  it("should fail to create assigned user with existing email", async () => {
    const dummy = await createDummyData();

    await api.user["create-user"].post(
      newUserData,
      userHeader(dummy.admin.token)
    );

    const res = await api.user["create-user"].post(
      newUserData,
      userHeader(dummy.admin.token)
    );

    expect(res.status).toBe(409);
  });

  it("should fetch assigned users", async () => {
    const dummy = await createDummyData();

    await api.user["create-user"].post(
      newUserData,
      userHeader(dummy.admin.token)
    );

    const res = await api.user["get-assigned-users"].get(
      userHeader(dummy.admin.token)
    );

    expect(res.status).toBe(200);
    expect(res.data).toBeArray();
    expect((res.data as UserModel.UserInfo[]).length).toBeGreaterThan(0);
  });

  it("should fetch assigned users by role", async () => {
    const dummy = await createDummyData();

    const res = await api.user["get-assigned-users"]({ role: "operator" }).get(
      userHeader(dummy.admin.token)
    );

    expect(res.status).toBe(200);
    expect(res.data).toBeArray();
  });

  it("should delete assigned user", async () => {
    const dummy = await createDummyData();

    const createRes = await api.user["create-user"].post(
      newUserData,
      userHeader(dummy.admin.token)
    );

    expect(createRes.status).toBe(200);
    const createdUser = createRes.data as UserModel.UserInfo;

    const deleteRes = await api.user["delete-assigned-users"]({
      userId: createdUser.id,
    }).delete(undefined, userHeader(dummy.admin.token));

    expect(deleteRes.status).toBe(200);

    const fetchRes = await api.user["get-assigned-users"].get(
      userHeader(dummy.admin.token)
    );

    const deletedUserExists = (fetchRes.data as UserModel.UserInfo[]).some(
      (user) => user.id === createdUser.id
    );
    expect(deletedUserExists).toBe(false);
  });

  it("should not allow non-admin to create user", async () => {
    const dummy = await createDummyData();

    const res = await api.user["create-user"].post(
      newUserData,
      userHeader(dummy.operator.token)
    );

    expect(res.status).toBe(401);
  });

  it("should not allow non-admin to delete assigned user", async () => {
    const dummy = await createDummyData();

    const createRes = await api.user["create-user"].post(
      newUserData,
      userHeader(dummy.admin.token)
    );

    expect(createRes.status).toBe(200);
    const createdUser = createRes.data as UserModel.UserInfo;

    const deleteRes = await api.user["delete-assigned-users"]({
      userId: createdUser.id,
    }).delete(undefined, userHeader(dummy.operator.token));

    expect(deleteRes.status).toBe(401);
  });

  it("should not allow deleting user assigned to another admin", async () => {
    const dummy = await createDummyData();
    const secondaryDummy = await createSecondaryDummyData();

    const createRes = await api.user["create-user"].post(
      newUserData,
      userHeader(dummy.admin.token)
    );

    expect(createRes.status).toBe(200);
    const createdUser = createRes.data as UserModel.UserInfo;

    const deleteRes = await api.user["delete-assigned-users"]({
      userId: createdUser.id,
    }).delete(undefined, userHeader(secondaryDummy.admin.token));

    expect(deleteRes.status).toBe(401);
  });

  it("should update user location", async () => {
    const dummy = await createDummyData();

    const res = await api.user.location.put(
      testLocation,
      userHeader(dummy.admin.token)
    );

    expect(res.status).toBe(200);
  });

  it("should update existing user location", async () => {
    const dummy = await createDummyData();

    await api.user.location.put(testLocation, userHeader(dummy.admin.token));

    const newLocation = {
      latitude: 40.7128,
      longitude: -74.006,
    };

    const res = await api.user.location.put(
      newLocation,
      userHeader(dummy.admin.token)
    );

    expect(res.status).toBe(200);
  });
});
