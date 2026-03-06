import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RefundRequest from "@/models/RefundRequest";
import TokenTransaction from "@/models/TokenTransaction";
import User, { UserRole } from "@/models/User";
import { withApiHandler } from "@/utils/withApiHandler";
import { apiSuccess } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";

export const GET = withApiHandler(async (req: NextRequest) => {
  await dbConnect();

  const userId = req.headers.get("x-user-id");
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found.");

  const { searchParams } = new URL(req.url);
  const filterUserId = searchParams.get("userId");

  let refunds;

  if (user.role === UserRole.ADMIN) {
    const query = filterUserId ? { user: filterUserId } : {};
    refunds = await RefundRequest.find(query)
      .populate("user", "firstName lastName email image")
      .populate({
        path: "transaction",
        populate: { path: "plan", select: "name price tokens currency" },
      })
      .populate("processedBy", "firstName lastName email")
      .sort({ createdAt: -1 });
  } else {
    refunds = await RefundRequest.find({ user: userId })
      .populate({
        path: "transaction",
        populate: { path: "plan", select: "name price tokens currency" },
      })
      .sort({ createdAt: -1 });
  }

  return apiSuccess(200, refunds, "Refund requests fetched successfully.");
});

export const POST = withApiHandler(async (req: NextRequest) => {
  await dbConnect();

  const userId = req.headers.get("x-user-id");
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { transactionId, reason } = await req.json();

  if (!transactionId) throw new ApiError(400, "Transaction ID is required.");
  if (!reason || !reason.trim()) throw new ApiError(400, "Reason is required.");

  const transaction = await TokenTransaction.findById(transactionId);
  if (!transaction) throw new ApiError(404, "Transaction not found.");
  if (transaction.user.toString() !== userId) {
    throw new ApiError(403, "This transaction does not belong to you.");
  }
  if (transaction.type !== "purchase") {
    throw new ApiError(400, "Refunds can only be requested for purchases.");
  }

  const existingRefund = await RefundRequest.findOne({
    transaction: transactionId,
    status: { $in: ["pending", "approved"] },
  });
  if (existingRefund) {
    throw new ApiError(
      400,
      "A refund request already exists for this transaction.",
    );
  }

  const refund = await RefundRequest.create({
    user: userId,
    transaction: transactionId,
    reason: reason.trim(),
  });

  return apiSuccess(201, refund, "Refund request submitted successfully.");
});
