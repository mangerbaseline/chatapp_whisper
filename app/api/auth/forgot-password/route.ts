import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { withApiHandler } from "@/utils/withApiHandler";
import { ApiError } from "@/utils/api-error";
import { randomInt } from "crypto";
import User from "@/models/User";
import { apiSuccess } from "@/utils/api-response";
import { hashPassword } from "@/lib/hash";
import { sendEmail } from "@/lib/mail";
import { getPasswordResetEmailTemplate } from "@/lib/email-templates";
import { sendSms } from "@/lib/sms";

export const POST = withApiHandler(async (req: NextRequest) => {
  await dbConnect();

  const { email } = await req.json();

  if (!email) {
    throw new ApiError(404, "Email is required.");
  }

  const user = await User.findOne({
    email,
  });

  if (!user) {
    throw new ApiError(404, "No user found.");
  }

  const otp = randomInt(1000, 10000).toString();

  const hashOtp = await hashPassword(otp);
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
  await User.updateOne(
    {
      email,
    },
    {
      otp: hashOtp,
      otpExpiry,
    },
  );

  await Promise.all([
    sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      text: `Your OTP is: ${otp}`,
      html: getPasswordResetEmailTemplate(
        user.firstName || user.email.split("@")[0],
        otp,
      ),
    }),
    sendSms(
      user.mobileNo ?? "",
      `Your OTP for password reset is: ${otp}. Valid for 5 minutes. Do not share this with anyone.`,
    ),
  ]);

  return apiSuccess(200, otp, "Otp sent successfully.");
});
