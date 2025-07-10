import { dummyAuthenticatedUser } from "./setup.test";

export function dummyAuthenticatedUserHeader() {
  return {
    headers: {
      authorization: dummyAuthenticatedUser.token,
    },
  };
}
