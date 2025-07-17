import Elysia, { t } from "elysia";
import { FileStorageService } from "../../services/storage/s3";
import { authMacroPlugin } from "../auth/macro";

export const filePlugin = new Elysia({
	name: "file",
	prefix: "/file",
})
	.use(authMacroPlugin)
	.get(
		"/:id",
		async ({ params: { id } }) => await FileStorageService.getFileUrl(id),
		{
			params: t.Object({
				id: t.String(),
			}),
			user: true,
		},
	);
