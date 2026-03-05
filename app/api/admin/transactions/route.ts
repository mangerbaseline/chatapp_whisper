import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import TokenTransaction from "@/models/TokenTransaction";
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

  const adminUser = await User.findById(userId).select({ role: true });

  if (!adminUser || adminUser.role !== "ADMIN") {
    throw new ApiError(401, "Unauthorized");
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const transactions = await TokenTransaction.find()
    .populate("user", "firstName lastName email")
    .populate("fromUser", "firstName lastName email")
    .populate("toUser", "firstName lastName email")
    .populate("plan", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await TokenTransaction.countDocuments();

  return apiSuccess(
    200,
    {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
    "Transactions fetched successfully.",
  );
});
