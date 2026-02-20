import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { saveFile, deleteFile } from "@/lib/files";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { NextRequest } from "next/server";

export const PATCH = withApiHandler(async (req: NextRequest) => {
  await dbConnect();

  const userId = req.headers.get("x-user-id");
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new ApiError(400, "No file uploaded");
  }

  if (!file.type.startsWith("image/")) {
    throw new ApiError(400, "Invalid file type. Only images are allowed.");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.image) {
    await deleteFile(user.image);
  }

  const { url } = await saveFile(file);

  user.image = url;
  await user.save();

  return apiSuccess(200, { image: url }, "Profile image updated successfully");
});
