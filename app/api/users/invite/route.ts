import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { sendEmail } from "@/lib/mail";
import { getInviteEmailTemplate } from "@/lib/email-templates";
import { withApiHandler } from "@/utils/withApiHandler";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";

export const POST = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const { email } = await req.json();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new ApiError(400, "Please provide a valid email address.");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "User with this email is already registered.");
  }

  const inviter = await User.findById(userId);
  if (!inviter) {
    throw new ApiError(404, "Inviter not found.");
  }

  const inviterName = inviter.firstName
    ? `${inviter.firstName} ${inviter.lastName || ""}`.trim()
    : inviter.email;

  await sendEmail({
    to: email,
    subject: `${inviterName} invited you to join Whispr`,
    text: `${inviterName} has invited you to join Whispr! Register at ${process.env.NEXT_PUBLIC_BASE_URL}/auth/sign-up`,
    html: getInviteEmailTemplate(inviterName),
  });

  return apiSuccess(200, null, "Invitation sent successfully.");
});
