import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { NextRequest } from "next/server";

export const GET = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await User.findById(userId).select({
    id: true,
    email: true,
    role: true,
    createdAt: true,
  });

  if (!user || user.role !== "ADMIN") {
    throw new ApiError(401, "Unauthorized");
  }

  const users = await User.find({
    role: "USER",
  }).select({
    _id: true,
    email: true,
    role: true,
    firstName: true,
    lastName: true,
    dateOfBirth: true,
    address: true,
    createdAt: true,
    isActive: true,
  });

  if (!users) {
    throw new ApiError(404, "No user found.");
  }

  return apiSuccess(200, users, "Users fetched successfully.");
});
