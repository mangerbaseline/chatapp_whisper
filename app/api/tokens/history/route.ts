import dbConnect from "@/lib/dbConnect";
import TokenTransaction from "@/models/TokenTransaction";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { NextRequest } from "next/server";

export const GET = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");
  if (!userId) throw new ApiError(401, "Unauthorized");

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    TokenTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("plan", "name")
      .populate("fromUser", "firstName lastName email")
      .populate("toUser", "firstName lastName email"),
    TokenTransaction.countDocuments({ user: userId }),
  ]);

  return apiSuccess(
    200,
    { transactions, total, page, totalPages: Math.ceil(total / limit) },
    "History fetched.",
  );
});
