import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import TokenPlan from "@/models/TokenPlan";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { NextRequest } from "next/server";

export const PATCH = withApiHandler(async (req: NextRequest, context) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(userId);
  if (!user || user.role !== "ADMIN") throw new ApiError(403, "Forbidden");

  const { id } = await context.params;
  const body = await req.json();

  const plan = await TokenPlan.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });

  if (!plan) throw new ApiError(404, "Plan not found.");
  return apiSuccess(200, plan, "Plan updated successfully.");
});

export const DELETE = withApiHandler(async (req: NextRequest, context) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(userId);
  if (!user || user.role !== "ADMIN") throw new ApiError(403, "Forbidden");

  const { id } = await context.params;
  const plan = await TokenPlan.findByIdAndDelete(id);

  if (!plan) throw new ApiError(404, "Plan not found.");
  return apiSuccess(200, null, "Plan deleted successfully.");
});
