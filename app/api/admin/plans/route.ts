import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import TokenPlan from "@/models/TokenPlan";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { NextRequest } from "next/server";

export const GET = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(userId);
  if (!user || user.role !== "ADMIN") throw new ApiError(403, "Forbidden");

  const plans = await TokenPlan.find()
    .sort({ createdAt: -1 })
    .populate("createdBy", "firstName lastName email");

  return apiSuccess(200, plans, "Plans fetched successfully.");
});

export const POST = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(userId);
  if (!user || user.role !== "ADMIN") throw new ApiError(403, "Forbidden");

  const body = await req.json();
  const { name, description, price, currency, tokens } = body;

  if (!name || !price || !tokens) {
    throw new ApiError(400, "Name, price, and tokens are required.");
  }

  const plan = await TokenPlan.create({
    name,
    description: description || "",
    price,
    currency: "usd",
    tokens,
    createdBy: userId,
  });

  return apiSuccess(201, plan, "Plan created successfully.");
});
