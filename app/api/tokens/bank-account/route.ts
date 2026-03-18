import dbConnect from "@/lib/dbConnect";
import { User } from "@/models";
import BankVerificationRequest from "@/models/BankVerificationRequest";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { NextRequest } from "next/server";
import { sendEmail } from "@/lib/mail";
import { getBankVerificationSubmittedTemplate } from "@/lib/email-templates";

export const POST = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");

  if (!userId) throw new ApiError(401, "Unauthorized");

  const {
    accountHolderName,
    accountNumber,
    routingNumber,
    bankName,
    accountType,
    dobDay,
    dobMonth,
    dobYear,
    addressLine1,
    addressCity,
    addressState,
    addressPostalCode,
    firstName,
    lastName,
    phone,
    fullSsn,
  } = await req.json();

  if (
    !accountHolderName ||
    !accountNumber ||
    !routingNumber ||
    !bankName ||
    !firstName ||
    !lastName ||
    !phone ||
    !fullSsn
  ) {
    throw new ApiError(400, "Missing required bank or identity details.");
  }

  const ssnLast4 = fullSsn.slice(-4);

  if (!dobDay || !dobMonth || !dobYear) {
    throw new ApiError(400, "Date of birth is required.");
  }

  if (!addressLine1 || !addressCity || !addressState || !addressPostalCode) {
    throw new ApiError(400, "Full address is required.");
  }

  const last4 = accountNumber.slice(-4);

  await BankVerificationRequest.create({
    user: userId,
    accountHolderName,
    accountNumber,
    routingNumber,
    bankName,
    accountType,
    last4,
    dobDay: parseInt(dobDay),
    dobMonth: parseInt(dobMonth),
    dobYear: parseInt(dobYear),
    ssnLast4,
    addressLine1,
    addressCity,
    addressState,
    addressPostalCode,
    firstName,
    lastName,
    phone,
    fullSsn,
  });

  const user = await User.findById(userId);
  if (user?.email) {
    await sendEmail({
      to: user.email,
      subject: "Bank Verification Submitted",
      text: `Your bank account details have been submitted for verification.`,
      html: getBankVerificationSubmittedTemplate(user.firstName || user.email.split("@")[0]),
    });
  }

  await User.findByIdAndUpdate(userId, { bankAccountStatus: "pending" });

  return apiSuccess(200, null, "Bank details submitted for verification.");
});
