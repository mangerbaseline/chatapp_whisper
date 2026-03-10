import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { withApiHandler } from "@/utils/withApiHandler";
import { ApiError } from "@/utils/api-error";
import User from "@/models/User";
import { hashPassword } from "@/lib/hash";
import { apiSuccess } from "@/utils/api-response";
import { sendEmail } from "@/lib/mail";
import { getPasswordResetSuccessEmailTemplate } from "@/lib/email-templates";

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

  const hashedPassword = await hashPassword(newPassword);

  await User.updateOne(
    { _id: user._id },
    {
      $unset: { resetPasswordToken: 1, resetPasswordExpiry: 1 },
      $set: { password: hashedPassword },
    },
  );

  await sendEmail({
    to: user.email,
    subject: "Password Reset Successful",
    text: "Your password has been successfully reset. You can now log in.",
    html: getPasswordResetSuccessEmailTemplate(user.firstName || "User"),
  });

  return apiSuccess(200, null, "Password reset successful");
});
