import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import dbConnect from "@/lib/dbConnect";
import RefundRequest from "@/models/RefundRequest";
import { sendEmail } from "@/lib/mail";
import { getRefundedEmailTemplate } from "@/lib/email-templates";

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
    }

    return new NextResponse("Webhook processed successfully", { status: 200 });
  } catch (error: any) {
    console.error(`Error processing webhook: ${error.message}`);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
