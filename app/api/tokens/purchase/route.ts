import dbConnect from "@/lib/dbConnect";
import stripe from "@/lib/stripe";
import User from "@/models/User";
import TokenPlan from "@/models/TokenPlan";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { NextRequest } from "next/server";

export const POST = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found.");

  const { planId } = await req.json();
  if (!planId) throw new ApiError(400, "Plan ID is required.");

  const plan = await TokenPlan.findById(planId);
  if (!plan || !plan.isActive)
    throw new ApiError(404, "Plan not found or inactive.");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: plan.currency,
          product_data: {
            name: plan.name,
            description: `${plan.tokens} tokens`,
          },
          unit_amount: plan.price,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${baseUrl}/wallet?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/wallet?cancelled=true`,
    metadata: {
      userId: userId,
      planId: planId,
      tokens: plan.tokens.toString(),
    },
  });

  return apiSuccess(
    200,
    { sessionId: session.id, url: session.url },
    "Checkout session created.",
  );
});
