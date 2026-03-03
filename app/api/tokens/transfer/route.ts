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

  const { toUserId, amount, note } = await req.json();

  if (!toUserId || !amount) {
    throw new ApiError(400, "Recipient and amount are required.");
  }

  if (amount <= 0) throw new ApiError(400, "Amount must be positive.");
  if (toUserId === userId)
    throw new ApiError(400, "Cannot transfer to yourself.");

  const receiver = await User.findById(toUserId);
  if (!receiver) throw new ApiError(404, "Recipient not found.");

  const sender = await User.findOneAndUpdate(
    { _id: userId, tokenBalance: { $gte: amount } },
    { $inc: { tokenBalance: -amount } },
    { new: true },
  );

  if (!sender) {
    throw new ApiError(400, "Insufficient balance.");
  }

  const updatedReceiver = await User.findByIdAndUpdate(
    toUserId,
    { $inc: { tokenBalance: amount } },
    { new: true },
  );

  await TokenTransaction.insertMany([
    {
      user: userId,
      type: "transfer_sent",
      amount: amount,
      balanceAfter: sender.tokenBalance,
      fromUser: userId,
      toUser: toUserId,
      note: note || "",
    },
    {
      user: toUserId,
      type: "transfer_received",
      amount: amount,
      balanceAfter: updatedReceiver!.tokenBalance,
      fromUser: userId,
      toUser: toUserId,
      note: note || "",
    },
  ]);

  return apiSuccess(
    200,
    { balance: sender.tokenBalance },
    `Successfully sent ${amount} tokens.`,
  );
});
