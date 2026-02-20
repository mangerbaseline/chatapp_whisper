import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { withApiHandler } from "@/utils/withApiHandler";
import { ApiError } from "@/utils/api-error";
import User from "@/models/User";
import { apiSuccess } from "@/utils/api-response";
import { comparePassword } from "@/lib/hash";
import { randomBytes } from "crypto";

export const POST = withApiHandler(async (req: NextRequest) => {
  await dbConnect();

  const { email, otp } = await req.json();

  if (!email || !otp) {
    throw new ApiError(400, "Bad Request");
  }

  const user = await User.findOne({ email });

  if (!user || !user.otp || !user.otpExpiry) {
    throw new ApiError(404, "Invalid request");
  }

  if (user.otpExpiry < new Date()) {
    throw new ApiError(403, "OTP expired");
  }

  const isOtpValid = await comparePassword(otp, user.otp);

  if (!isOtpValid) {
    throw new ApiError(403, "Invalid OTP");
  }

  const resetToken = randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = undefined;
  user.otpExpiry = undefined;
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpiry = resetTokenExpiry;

  await user.save();

  return apiSuccess(
    200,
    { resetToken },
    "OTP verified, proceed to reset password",
  );
});
