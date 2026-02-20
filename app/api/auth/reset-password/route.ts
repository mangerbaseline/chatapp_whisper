import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { withApiHandler } from "@/utils/withApiHandler";
import { ApiError } from "@/utils/api-error";
import User from "@/models/User";
import { hashPassword } from "@/lib/hash";
import { apiSuccess } from "@/utils/api-response";

export const POST = withApiHandler(async (req: NextRequest) => {
  await dbConnect();

  const { resetToken, newPassword } = await req.json();

  if (!resetToken || !newPassword) {
    throw new ApiError(400, "Bad Request");
  }

  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpiry: { $gt: new Date() },
  });

  if (!user) {
    throw new ApiError(403, "Invalid or expired reset token");
  }

  user.password = await hashPassword(newPassword);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;

  await user.save();

  return apiSuccess(200, null, "Password reset successful");
});
