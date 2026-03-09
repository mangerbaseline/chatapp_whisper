import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RefundRequest from "@/models/RefundRequest";
import TokenTransaction from "@/models/TokenTransaction";
import User, { UserRole } from "@/models/User";
import { withApiHandler } from "@/utils/withApiHandler";
import { apiSuccess } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";
import { sendEmail } from "@/lib/mail";
import {
  getRefundInitiatedEmailTemplate,
  getRefundRejectedEmailTemplate,
} from "@/lib/email-templates";
import stripe from "@/lib/stripe";

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

    if (!status || !["initiated", "rejected"].includes(status)) {
      throw new ApiError(400, "Valid status (initiated/rejected) is required.");
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

    if (status === "initiated") {
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

      if (transaction.stripePaymentIntentId) {
        await stripe.refunds.create({
          payment_intent: transaction.stripePaymentIntentId,
          amount: refundMoney,
          reason: "requested_by_customer",
          metadata: {
            refundRequestId: refund._id.toString(),
          },
        });
      }
    }

    refund.status = status;
    refund.adminNote = adminNote || "";
    refund.processedBy = admin._id;
    refund.processedAt = new Date();
    await refund.save();

    const refundUser = await User.findById(refund.user);
    if (refundUser?.email) {
      const planName = transaction.plan?.name || "Token Plan";
      if (status === "initiated") {
        const refundAmountFormatted = (refund.refundAmount / 100).toFixed(2);
        const curr = (transaction.currency || "usd").toUpperCase();
        await sendEmail({
          to: refundUser.email,
          subject: "Your Refund Has Been Initiated",
          text: `Your refund request for ${planName} has been initiated. Refund amount: ${refundAmountFormatted} ${curr} (${refund.percentageCut}% platform fee applied).`,
          html: getRefundInitiatedEmailTemplate(
            refundUser.firstName || refundUser.email.split("@")[0],
            planName,
            refund.refundAmount / 100,
            curr,
            refund.adminNote,
          ),
        });
      } else {
        await sendEmail({
          to: refundUser.email,
          subject: "Your Refund Request Has Been Rejected",
          text: `Your refund request for ${planName} has been rejected.${refund.adminNote ? " Reason: " + refund.adminNote : ""}`,
          html: getRefundRejectedEmailTemplate(
            refundUser.firstName || refundUser.email.split("@")[0],
            planName,
            refund.adminNote,
          ),
        });
      }
    }

    return apiSuccess(200, refund, `Refund request ${status}.`);
  },
);
