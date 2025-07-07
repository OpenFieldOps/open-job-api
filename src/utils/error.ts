import { status } from "elysia";

export namespace AppError {
  export const NotFound = status(404, "Not Found");
  export const AlreadyExist = status(409, "Already Exist");
  export const Conflict = status(409, "Conflict");
  export const Unauthorized = status(401, "Unauthorized");
}
