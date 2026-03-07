import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import dbConnect from "@/lib/dbConnect";
import RefundRequest from "@/models/RefundRequest";

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
        await RefundRequest.findByIdAndUpdate(refundRequestId, {
          status: "refunded",
        });
        console.log(`Refund ${refundRequestId} marked as refunded!`);
      }
    }

    return new NextResponse("Webhook processed successfully", { status: 200 });
  } catch (error: any) {
    console.error(`Error processing webhook: ${error.message}`);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
