import { signToken } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import { comparePassword } from "@/lib/hash";
import User from "@/models/User";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { loginSchema } from "@/verification/auth.verification";
import { NextRequest } from "next/server";

function updateLoginStreak(user: any) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;

  if (lastLogin) {
    const lastLoginDay = new Date(
      lastLogin.getFullYear(),
      lastLogin.getMonth(),
      lastLogin.getDate(),
    );
    const diffMs = today.getTime() - lastLoginDay.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      user.consecutiveLoginDays = (user.consecutiveLoginDays || 0) + 1;
    } else if (diffDays === 0) {
      // Already logged in today, no change
    } else {
      user.consecutiveLoginDays = 1;
    }
  } else {
    user.consecutiveLoginDays = 1;
  }

  user.lastLoginDate = now;
  user.lastSeen = now;
}

export const POST = withApiHandler(async (req: NextRequest) => {
  await dbConnect();

  const body = await req.json();

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    throw parsed.error;
  }

  const { identifier, password } = parsed.data;

  const user = await User.findOne({
    $or: [{ email: identifier }, { mobileNo: identifier }],
  });

  if (!user) {
    throw new ApiError(404, "User Not Found.");
  }

  if (user.isActive === false) {
    throw new ApiError(
      403,
      "Your account is inactive. Please contact support.",
    );
  }

  if (user.isDeactivated === true) {
    const error = new ApiError(
      403,
      "Your account has been deactivated due to inactivity. Please verify OTP to reactivate.",
    );
    (error as any).isDeactivated = true;
    throw error;
  }

  const comparedPassword = await comparePassword(password, user.password!);

  if (!comparedPassword) {
    throw new ApiError(401, "Invalid credentials.");
  }

  updateLoginStreak(user);
  await user.save();

  const token = signToken({
    id: user._id,
    role: user.role,
  });

  const loginedUser = {
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
    bankAccountStatus: user.bankAccountStatus,
    linkedBankLast4: user.linkedBankLast4,
    linkedBankName: user.linkedBankName,
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
