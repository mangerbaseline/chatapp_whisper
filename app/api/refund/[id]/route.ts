import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RefundRequest from "@/models/RefundRequest";
import TokenTransaction from "@/models/TokenTransaction";
import User, { UserRole } from "@/models/User";
import { withApiHandler } from "@/utils/withApiHandler";
import { apiSuccess } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";
import { sendEmail } from "@/lib/mail";

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

    const refundUser = await User.findById(refund.user);
    if (refundUser?.email) {
      const planName = transaction.plan?.name || "Token Plan";
      if (status === "approved") {
        const refundAmountFormatted = (refund.refundAmount / 100).toFixed(2);
        const curr = (transaction.currency || "usd").toUpperCase();
        await sendEmail({
          to: refundUser.email,
          subject: "Your Refund Has Been Approved",
          text: `Your refund request for ${planName} has been approved. Refund amount: ${refundAmountFormatted} ${curr} (${refund.percentageCut}% platform fee applied).`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">Refund Approved &#10003;</h2>
              <p>Hi ${refundUser.firstName || "there"},</p>
              <p>Your refund request for <strong>${planName}</strong> has been approved.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Refund Amount</td><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">${refundAmountFormatted} ${curr}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Platform Fee</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${refund.percentageCut}%</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Tokens Deducted</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${refund.tokensDeducted}</td></tr>
              </table>
              ${refund.adminNote ? `<p><strong>Note:</strong> ${refund.adminNote}</p>` : ""}
              <p style="color: #6b7280; font-size: 14px;">The refund will be processed to your original payment method shortly.</p>
            </div>
          `,
        });
      } else {
        await sendEmail({
          to: refundUser.email,
          subject: "Your Refund Request Has Been Rejected",
          text: `Your refund request for ${planName} has been rejected.${refund.adminNote ? " Reason: " + refund.adminNote : ""}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Refund Request Rejected</h2>
              <p>Hi ${refundUser.firstName || "there"},</p>
              <p>Unfortunately, your refund request for <strong>${planName}</strong> has been rejected.</p>
              ${refund.adminNote ? `<p><strong>Reason:</strong> ${refund.adminNote}</p>` : ""}
              <p style="color: #6b7280; font-size: 14px;">If you believe this is an error, please create a support ticket to discuss further.</p>
            </div>
          `,
        });
      }
    }

    return apiSuccess(200, refund, `Refund request ${status}.`);
  },
);
