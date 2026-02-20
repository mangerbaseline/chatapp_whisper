import { blockJwt } from "@/lib/blockJwt";
import { withApiHandler } from "@/utils/withApiHandler";
import { NextRequest, NextResponse } from "next/server";

export const POST = withApiHandler(async (req: NextRequest) => {
  const token = req.cookies.get("auth_token")?.value;

  if (token) {
    await blockJwt(token);
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });

  response.cookies.set("auth_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
});
