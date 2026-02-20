import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { NextRequest } from "next/server";

export const DELETE = withApiHandler(async (req: NextRequest) => {
  await dbConnect();

  const _id = req.headers.get("x-user-id");

  if (!_id) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await User.findById({
    _id,
  });

  if (!user) {
    throw new ApiError(404, "No user found.");
  }

  await User.deleteOne({
    _id: user._id,
  });

  return apiSuccess(201, null, "Account deleted successfully.");
});
