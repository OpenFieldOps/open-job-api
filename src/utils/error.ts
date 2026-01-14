import { status } from "elysia";

export namespace AppError {
	export const NotFound = status(404, "Not Found");
	export const AlreadyExist = status(409, "Already Exist");
	export const Conflict = status(409, "Conflict");
	export const Unauthorized = status(401, "Unauthorized");
	export const InternalServerError = status(500, "Internal Server Error");
	export const BadRequest = status(400, "Bad Request");

	export enum ResultEnum {
		NotFound = 404,
		AlreadyExist = 409,
		Conflict = 409,
		Unauthorized = 410,
		InternalServerError = 500,
	}
}
