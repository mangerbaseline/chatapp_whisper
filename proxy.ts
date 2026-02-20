import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import jwt from "jsonwebtoken";
import redisClient from "./lib/redis";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon.ico")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth_token")?.value;

  let user: { id: string; jti: string; role: string } | null = null;

  if (token) {
    try {
      const decoded = verifyToken(token) as jwt.JwtPayload;

      if (!decoded.jti || typeof decoded.id !== "string") {
        throw new Error("Invalid token payload");
      }

      const isBlocked = await redisClient.get(`blocked_jwt:${decoded.jti}`);

      if (!isBlocked) {
        user = {
          id: decoded.id,
          jti: decoded.jti,
          role: decoded.role,
        };
      }
    } catch {
      user = null;
    }
  }

  if (pathname === "/") {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/sign-in", req.url));
    }
  }

  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/sign-in", req.url));
    }
    if (user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  const isPublicPage =
    pathname.startsWith("/auth/sign-in") ||
    pathname.startsWith("/auth/sign-up");

  if (user && isPublicPage) {
    if (user.role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (user) {
    const res = NextResponse.next();
    res.headers.set("x-user-id", user.id);
    return res;
  }
  return NextResponse.next();
}

export const proxyConfig = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
