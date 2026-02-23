import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { withApiHandler } from "@/utils/withApiHandler";
import { ApiError } from "@/utils/api-error";
import User from "@/models/User";
import { apiSuccess } from "@/utils/api-response";
import { comparePassword } from "@/lib/hash";
import { signToken } from "@/lib/auth";

export const POST = withApiHandler(async (req: NextRequest) => {
  await dbConnect();

  const { email, otp } = await req.json();

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required.");
  }

  const user = await User.findOne({ email });

  if (!user || !user.otp || !user.otpExpiry) {
    throw new ApiError(404, "Invalid request.");
  }

  if (!user.isDeactivated) {
    throw new ApiError(400, "This account is not deactivated.");
  }

  if (user.otpExpiry < new Date()) {
    throw new ApiError(403, "OTP expired.");
  }

  const isOtpValid = await comparePassword(otp, user.otp);

  if (!isOtpValid) {
    throw new ApiError(403, "Invalid OTP.");
  }

  user.isDeactivated = false;
  user.deactivatedAt = null;
  user.consecutiveLoginDays = 1;
  user.lastLoginDate = new Date();
  user.lastSeen = new Date();
  user.otp = undefined;
  user.otpExpiry = undefined;

  await user.save();

  const token = signToken({
    id: user._id,
    role: user.role,
  });

  const userData = {
    _id: user._id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    firstName: user.firstName,
    lastName: user.lastName,
    dateOfBirth: user.dateOfBirth,
    address: user.address,
    provider: user.provider,
    image: user.image,
    token,
  };

  const response = apiSuccess(
    200,
    userData,
    "Account reactivated successfully. Welcome back!",
  );

  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return response;
});
