import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RefundRequest from "@/models/RefundRequest";
import TokenTransaction from "@/models/TokenTransaction";
import User, { UserRole } from "@/models/User";
import { withApiHandler } from "@/utils/withApiHandler";
import { apiSuccess } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";

export const PATCH = withApiHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    await dbConnect();

    const userId = req.headers.get("x-user-id");
    if (!userId) throw new ApiError(401, "Unauthorized");

    const admin = await User.findById(userId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ApiError(403, "Admins only.");
    }

    const { id: refundId } = await params;
    const { status, percentageCut = 10, adminNote } = await req.json();

    if (!status || !["approved", "rejected"].includes(status)) {
      throw new ApiError(400, "Valid status (approved/rejected) is required.");
    }

    const refund = await RefundRequest.findById(refundId).populate({
      path: "transaction",
      populate: { path: "plan", select: "name price tokens currency" },
    });

    if (!refund) throw new ApiError(404, "Refund request not found.");
    if (refund.status !== "pending") {
      throw new ApiError(400, "This refund has already been processed.");
    }

    const transaction = refund.transaction as any;

    if (status === "approved") {
      const cut = Math.max(0, Math.min(100, percentageCut));
      const originalTokens = transaction.amount;
      const tokensToDeduct = originalTokens;
      const originalMoney = transaction.amountMoney || 0;
      const refundMoney = Math.floor(originalMoney * ((100 - cut) / 100));

      const user = await User.findByIdAndUpdate(
        refund.user,
        { $inc: { tokenBalance: -tokensToDeduct } },
        { new: true },
      );

      if (!user) throw new ApiError(404, "User not found.");

      await TokenTransaction.create({
        user: refund.user,
        type: "refund",
        amount: -tokensToDeduct,
        balanceAfter: user.tokenBalance,
        plan: transaction.plan?._id,
        amountMoney: refundMoney,
        currency: transaction.currency,
        note: `Refund for ${transaction.plan?.name || "plan"} (${cut}% cut)`,
      });

      refund.refundAmount = refundMoney;
      refund.percentageCut = cut;
      refund.tokensDeducted = tokensToDeduct;

      // TODO: Actual Stripe refund via stripe.refunds.create()
      // using transaction.stripePaymentIntentId and refundMoney
    }

    refund.status = status;
    refund.adminNote = adminNote || "";
    refund.processedBy = admin._id;
    refund.processedAt = new Date();
    await refund.save();

    return apiSuccess(200, refund, `Refund request ${status}.`);
  },
);
