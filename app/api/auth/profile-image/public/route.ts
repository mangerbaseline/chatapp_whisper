import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { saveFile, deleteFile } from "@/lib/files";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { NextRequest } from "next/server";

export const PATCH = withApiHandler(async (req: NextRequest) => {
  await dbConnect();

  const formData = await req.formData();
  const userId = formData.get("userId") as string;
  const file = formData.get("file") as File | null;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

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

  await User.findByIdAndUpdate(userId, { $set: { image: url } });
  console.log("[profile-image/public] Updated user image URL in DB:", url);

  return apiSuccess(200, { image: url }, "Profile image updated successfully");
});
