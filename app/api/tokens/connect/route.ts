import dbConnect from "@/lib/dbConnect";
import stripe from "@/lib/stripe";
import User from "@/models/User";
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    let accountId = user.stripeConnectAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        metadata: { userId },
      });
      accountId = account.id;
      user.stripeConnectAccountId = accountId;
      await user.save();
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/wallet?connect_refresh=true`,
      return_url: `${baseUrl}/wallet?connect_success=true`,
      type: "account_onboarding",
    });

    return apiSuccess(200, { url: accountLink.url }, "Connect link created.");
  } catch (err: any) {
    console.error("Stripe Connect error:", err.message, err.type);
    throw new ApiError(500, `Stripe Connect error: ${err.message}`);
  }
});

export const GET = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found.");

  if (!user.stripeConnectAccountId) {
    return apiSuccess(200, { connected: false }, "No Stripe account linked.");
  }

  const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);

  return apiSuccess(
    200,
    {
      connected: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    },
    "Connect status fetched.",
  );
});
