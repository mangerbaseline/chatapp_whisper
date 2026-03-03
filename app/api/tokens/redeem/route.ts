import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import TokenTransaction from "@/models/TokenTransaction";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { NextRequest } from "next/server";

export const POST = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { amount } = await req.json();

  if (!amount || amount <= 0) {
    throw new ApiError(400, "Amount must be positive.");
  }

  const pendingRedemption = await TokenTransaction.findOne({
    user: userId,
    type: "redemption",
    redemptionStatus: "pending",
  });

  if (pendingRedemption) {
    throw new ApiError(400, "You already have a pending redemption request.");
  }

  const user = await User.findOneAndUpdate(
    { _id: userId, tokenBalance: { $gte: amount } },
    { $inc: { tokenBalance: -amount } },
    { new: true },
  );

  if (!user) {
    throw new ApiError(400, "Insufficient balance.");
  }

  await TokenTransaction.create({
    user: userId,
    type: "redemption",
    amount: amount,
    balanceAfter: user.tokenBalance,
    redemptionStatus: "pending",
  });

  return apiSuccess(
    200,
    { balance: user.tokenBalance },
    "Redemption request submitted. Pending admin approval.",
  );
});
