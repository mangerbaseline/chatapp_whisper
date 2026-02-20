import { signToken } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { OAuth2Client } from "google-auth-library";
import { NextRequest } from "next/server";

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

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
