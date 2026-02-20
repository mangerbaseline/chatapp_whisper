import { adminCreatedUserEmail } from "@/emails";
import dbConnect from "@/lib/dbConnect";
import { hashPassword } from "@/lib/hash";
import { sendEmail } from "@/lib/mail";
import User from "@/models/User";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { NextRequest } from "next/server";
import { adminCreateUserSchema } from "@/verification/admin.verification";

export const POST = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const admin = await User.findById(userId).select({
    id: true,
    email: true,
    role: true,
    createdAt: true,
  });

  if (!admin || admin.role !== "ADMIN") {
    throw new ApiError(401, "Unauthorized");
  }

  const body = await req.json();

  const parsedData = adminCreateUserSchema.safeParse(body);

  if (!parsedData.success) {
    throw parsedData.error;
  }

  const { email, password, firstName, lastName, dateOfBirth, address } =
    parsedData.data;

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    email,
    password: hashedPassword,
    firstName,
    lastName,
    dateOfBirth,
    address,
    provider: "credentials",
  });

  await user.save();

  const emailContent = adminCreatedUserEmail({
    firstName: user.firstName!,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL!,
    email: user.email,
    password,
  });

  await sendEmail({
    to: user.email,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html,
  });
  return apiSuccess(200, user, "User created successfully.");
});
