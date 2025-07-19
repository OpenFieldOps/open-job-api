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

export async function createDummyData() {
	const [user, operator] = (await Promise.all([
		AuthService.registerUserAdmin(dummyUser),
		AuthService.registerUserAdmin(dummyOperatorUser),
	])) as (typeof AuthModel.AuthenticatedUserSuccessResponse.static)[];

	return {
		user,
		operator,
	};
}

if (require.main === module) {
	await createDummyData()
		.then(() => console.log("Dummy data created successfully"))
		.catch((error) => console.error("Error creating dummy data:", error));
}
