import { signToken } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { OAuth2Client } from "google-auth-library";
import { NextRequest } from "next/server";

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

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
  const { token } = await req.json();

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.email) {
    throw new ApiError(401, "Invalid google token.");
  }

  const { email, given_name, family_name, picture, sub: googleId } = payload;

  await dbConnect();

  let user = await User.findOne({ email });

  if (user && user.provider === "credentials") {
    throw new ApiError(409, "This email is registered with email & password.");
  }

  if (!user) {
    user = await User.create({
      firstName: given_name || "Google",
      lastName: family_name,
      email,
      image: picture,
      provider: "google",
      googleId,
    });
  }

  const createdUser = await User.findOne({ email });

  if (!createdUser) {
    throw new ApiError(400, "User not created. Try again ...");
  }

  if (createdUser.isDeactivated === true) {
    const error = new ApiError(
      403,
      "Your account has been deactivated due to inactivity. Please verify OTP to reactivate.",
    );
    (error as any).isDeactivated = true;
    throw error;
  }

  updateLoginStreak(createdUser);
  await createdUser.save();

  const appToken = signToken({
    id: createdUser._id,
    role: createdUser.role,
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
    token: appToken,
  };

  const response = apiSuccess(200, loginedUser, "Login Successful.");

  response.cookies.set("auth_token", appToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return response;
});
