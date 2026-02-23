import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { signToken } from "@/lib/auth";

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

  const { code } = await req.json();

  if (!code) {
    throw new ApiError(400, "Missing GitHub code");
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    throw new ApiError(401, "GitHub authentication failed");
  }

  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  const ghUser = await userRes.json();

  const emailRes = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  const emails = await emailRes.json();
  const primaryEmail = emails.find((e: any) => e.primary)?.email;

  if (!primaryEmail) {
    throw new ApiError(401, "GitHub email not found");
  }

  let user = await User.findOne({ email: primaryEmail });

  if (user && user.provider === "credentials") {
    throw new ApiError(409, "This email is registered with email & password.");
  }

  if (!user) {
    try {
      user = await User.create({
        email: primaryEmail,
        firstName: ghUser.name || ghUser.login,
        image: ghUser.avatar_url,
        provider: "github",
        githubId: ghUser.id,
      });
    } catch (error) {
      console.error("User Creation Error:", error);
      throw new ApiError(400, "User not created. Try again ...");
    }
  }

  const createdUser = await User.findOne({ email: primaryEmail });

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

  const token = signToken({ id: createdUser._id, role: createdUser.role });

  const response = apiSuccess(
    200,
    {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      provider: user.provider,
      image: user.image,
      token,
    },
    "Login successful",
  );

  response.cookies.set("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return response;
});
