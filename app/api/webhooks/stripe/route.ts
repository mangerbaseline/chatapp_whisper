import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import dbConnect from "@/lib/dbConnect";
import RefundRequest from "@/models/RefundRequest";
import { sendEmail } from "@/lib/mail";
import {
  getRefundedEmailTemplate,
  getRedemptionSuccessTemplate,
  getRedemptionFailedTemplate,
} from "@/lib/email-templates";
import { User, TokenTransaction } from "@/models";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  await dbConnect();

  try {
    if (event.type === "charge.refund.updated") {
      const refund = event.data.object as any;

      const refundRequestId = refund.metadata?.refundRequestId;

      if (refundRequestId && refund.status === "succeeded") {
        const updatedRefund = await RefundRequest.findByIdAndUpdate(
          refundRequestId,
          { status: "refunded" },
        )
          .populate({
            path: "transaction",
            populate: { path: "plan", select: "name" },
          })
          .populate("user");

        if (updatedRefund) {
          console.log(`Refund ${refundRequestId} marked as refunded!`);
          const user: any = updatedRefund.user;
          const transaction: any = updatedRefund.transaction;
          if (user?.email) {
            await sendEmail({
              to: user.email,
              subject: "Refund Processing Complete",
              text: `Your refund for ${transaction?.plan?.name || "your plan"} has completed processing. Refund ID: ${refundRequestId}`,
              html: getRefundedEmailTemplate(
                user.firstName || user.email.split("@")[0],
                refundRequestId,
                transaction?.plan?.name || "your plan",
              ),
            });
          }
        }
      }
    } else if (event.type === "payout.paid" || event.type === "payout.failed") {
      const payout = event.data.object as any;
      const stripePayoutId = payout.id;
      const status = event.type === "payout.paid" ? "completed" : "failed";

      const transaction = await TokenTransaction.findOneAndUpdate(
        { stripePayoutId },
        { status },
        { new: true },
      ).populate("user");

      if (transaction) {
        console.log(`Transaction ${transaction._id} updated to ${status}`);

        if (status === "failed") {
          const user = await User.findById(transaction.user);
          if (user) {
            user.tokenBalance += transaction.amount;
            await user.save();
            console.log(
              `Refunded ${transaction.amount} tokens to user ${user._id} due to payout failure.`,
            );
          }
        }

        const user: any = transaction.user;
        if (user?.email) {
          const payoutUsd = (transaction.amountMoney || 0) / 100;
          await sendEmail({
            to: user.email,
            subject: `Payout ${status === "completed" ? "Successful" : "Failed"}`,
            text: `Your payout of $${payoutUsd.toFixed(2)} has ${status === "completed" ? "been processed successfully" : "failed"}.`,
            html:
              status === "completed"
                ? getRedemptionSuccessTemplate(
                    user.firstName || user.email.split("@")[0],
                    transaction.amount,
                    payoutUsd,
                  )
                : getRedemptionFailedTemplate(
                    user.firstName || user.email.split("@")[0],
                    transaction.amount,
                    payoutUsd,
                  ),
          });
        }
      }
    }

    return new NextResponse("Webhook processed successfully", { status: 200 });
  } catch (error: any) {
    console.error(`Error processing webhook: ${error.message}`);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
