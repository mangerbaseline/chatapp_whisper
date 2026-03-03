import dbConnect from "@/lib/dbConnect";
import stripe from "@/lib/stripe";
import User from "@/models/User";
import TokenTransaction from "@/models/TokenTransaction";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { NextRequest } from "next/server";

// GET pending redemptions
export const GET = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");
  if (!userId) throw new ApiError(401, "Unauthorized");

  const admin = await User.findById(userId);
  if (!admin || admin.role !== "ADMIN") throw new ApiError(403, "Forbidden");

  const redemptions = await TokenTransaction.find({
    type: "redemption",
  })
    .sort({ createdAt: -1 })
    .populate("user", "firstName lastName email stripeConnectAccountId");

  return apiSuccess(200, redemptions, "Redemptions fetched.");
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");
  if (!userId) throw new ApiError(401, "Unauthorized");

  const admin = await User.findById(userId);
  if (!admin || admin.role !== "ADMIN") throw new ApiError(403, "Forbidden");

  const { transactionId, action, amountMoney, currency, adminNote } =
    await req.json();

  if (!transactionId || !action) {
    throw new ApiError(400, "Transaction ID and action are required.");
  }

  const transaction = await TokenTransaction.findById(transactionId);
  if (!transaction || transaction.type !== "redemption") {
    throw new ApiError(404, "Redemption not found.");
  }

  if (transaction.redemptionStatus !== "pending") {
    throw new ApiError(400, "Redemption already processed.");
  }

  if (action === "approve") {
    if (!amountMoney) {
      throw new ApiError(400, "Amount in money is required for approval.");
    }

    const redeemUser = await User.findById(transaction.user);
    if (!redeemUser) throw new ApiError(404, "User not found.");

    let stripeTransferId: string | undefined;

    if (redeemUser.stripeConnectAccountId) {
      try {
        const transfer = await stripe.transfers.create({
          amount: amountMoney,
          currency: currency || "usd",
          destination: redeemUser.stripeConnectAccountId,
          description: `Token redemption: ${transaction.amount} tokens`,
        });
        stripeTransferId = transfer.id;
      } catch (err: any) {
        throw new ApiError(500, `Stripe transfer failed: ${err.message}`);
      }
    }

    transaction.redemptionStatus = "approved";
    transaction.amountMoney = amountMoney;
    transaction.currency = currency || "usd";
    transaction.stripeTransferId = stripeTransferId;
    transaction.adminNote = adminNote || "";
    await transaction.save();

    return apiSuccess(200, transaction, "Redemption approved.");
  } else if (action === "reject") {
    await User.findByIdAndUpdate(transaction.user, {
      $inc: { tokenBalance: transaction.amount },
    });

    transaction.redemptionStatus = "rejected";
    transaction.adminNote = adminNote || "";
    await transaction.save();

    const updatedUser = await User.findById(transaction.user);
    if (updatedUser) {
      transaction.balanceAfter = updatedUser.tokenBalance;
      await transaction.save();
    }

    return apiSuccess(
      200,
      transaction,
      "Redemption rejected. Tokens refunded.",
    );
  }

  throw new ApiError(400, "Invalid action. Use 'approve' or 'reject'.");
});
