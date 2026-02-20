import jwt from "jsonwebtoken";
import redisClient from "@/lib/redis";

export async function blockJwt(token: string) {
  const decoded = jwt.decode(token) as jwt.JwtPayload;

  if (!decoded?.jti || !decoded?.exp) return;

  const ttl = decoded.exp - Math.floor(Date.now() / 1000);

  if (ttl > 0) {
    await redisClient.set(`blocked_jwt:${decoded.jti}`, "1", { EX: ttl });
  }
}
