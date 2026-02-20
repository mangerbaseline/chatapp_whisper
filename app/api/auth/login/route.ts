import { signToken } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import { comparePassword } from "@/lib/hash";
import User from "@/models/User";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { loginSchema } from "@/verification/auth.verification";
import { NextRequest } from "next/server";

export const POST = withApiHandler(async (req: NextRequest) => {
  await dbConnect();

  const body = await req.json();

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    throw parsed.error;
  }

  const { email, password } = parsed.data;

  const user = await User.findOne({
    email,
  });

  if (!user) {
    throw new ApiError(404, "User Not Found.");
  }

  if (!user.isActive) {
    throw new ApiError(
      403,
      "Your account is inactive. Please contact support.",
    );
  }

  const comparedPassword = await comparePassword(password, user.password!);

  if (!comparedPassword) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = signToken({
    id: user._id,
    role: user.role,
  });

  const loginedUser = {
    _id: user._id,
    email,
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

  const response = apiSuccess(200, loginedUser, "Login Successful.");

  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return response;
});
