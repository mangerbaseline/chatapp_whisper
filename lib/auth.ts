import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const SECRET = process.env.JWT_SECRET!;

export const signToken = (payload: object) =>
  jwt.sign({ ...payload, jti: randomUUID() }, SECRET, { expiresIn: "1d" });

export const verifyToken = (token: string) => jwt.verify(token, SECRET);
