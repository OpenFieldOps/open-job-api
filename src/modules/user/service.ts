import { eq } from "drizzle-orm";
import { db } from "../../services/db/db";
import { userTable } from "../../services/db/schema";
import { uploadFile } from "../../services/storage/s3";
import { UserModel } from "./model";

export abstract class UserService {
  static async updateUserInfo(body: UserModel.UserUpdateBody, userId: number) {
    await db
      .update(userTable)
      .set({
        firstName: body.firstName,
        lastName: body.lastName,
      })
      .where(eq(userTable.id, userId));
  }
  static async updateUserAvatar(file: File, userId: number) {
    const fileId = await uploadFile(file);
    await db
      .update(userTable)
      .set({
        avatar: fileId,
      })
      .where(eq(userTable.id, userId));
  }
}
