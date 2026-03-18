import dbConnect from "@/lib/dbConnect";
import stripe from "@/lib/stripe";
import { User, TokenTransaction } from "@/models";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { NextRequest } from "next/server";
import { sendEmail } from "@/lib/mail";
import { getRedemptionInitiatedTemplate } from "@/lib/email-templates";

const TOKEN_RATE_USD = 0.05;
const REDEMPTION_FEE_PERCENT = 0.1;

export const POST = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { amountTokens } = await req.json();
  if (!amountTokens || amountTokens <= 0)
    throw new ApiError(400, "Invalid token amount.");

  const user = await User.findById(userId);
  if (!user || user.bankAccountStatus !== "verified") {
    throw new ApiError(403, "Bank account not verified.");
  }

  if (user.tokenBalance < amountTokens) {
    throw new ApiError(400, "Insufficient token balance.");
  }

  const totalGrossUsd = amountTokens * TOKEN_RATE_USD;
  const adminFeeUsd = totalGrossUsd * REDEMPTION_FEE_PERCENT;
  const payoutUsd = totalGrossUsd - adminFeeUsd;

  const amountInCents = Math.floor(payoutUsd * 100);

  try {
    await stripe.transfers.create({
      amount: amountInCents,
      currency: "usd",
      destination: user.stripeAccountId!,
      description: `Token redemption: ${amountTokens} tokens (10% fee deducted)`,
    });

    const payout = await stripe.payouts.create(
      {
        amount: amountInCents,
        currency: "usd",
      },
      {
        stripeAccount: user.stripeAccountId,
      },
    );

    user.tokenBalance -= amountTokens;
    await user.save();

    await TokenTransaction.create({
      user: userId,
      type: "redemption",
      amount: amountTokens,
      balanceAfter: user.tokenBalance,
      amountMoney: amountInCents,
      currency: "usd",
      status: "initiated",
      stripePayoutId: payout.id,
      note: `Redemption initiated for ${amountTokens} tokens. Gross: $${totalGrossUsd.toFixed(2)}, Fee: $${adminFeeUsd.toFixed(2)}, Net: $${payoutUsd.toFixed(2)}. Payout ID: ${payout.id}`,
    });

    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "Redemption Request Received",
        text: `Your redemption request for ${amountTokens} tokens has been received.`,
        html: getRedemptionInitiatedTemplate(
          user.firstName || user.email.split("@")[0],
          amountTokens,
          payoutUsd,
        ),
      });
    }

    return apiSuccess(
      200,
      {
        newBalance: user.tokenBalance,
        receivedUsd: payoutUsd,
        feeUsd: adminFeeUsd,
      },
      `Redemption successful! $${payoutUsd.toFixed(2)} is being sent to your bank account.`,
    );
  } catch (error: any) {
    console.error("Redemption Error:", error);
    throw new ApiError(500, `Redemption failed: ${error.message}`);
  }
});
