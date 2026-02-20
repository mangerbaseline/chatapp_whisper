import { NextRequest } from "next/server";
import { ApiError } from "@/utils/api-error";
import { registerSchema } from "@/verification/auth.verification";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { hashPassword } from "@/lib/hash";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export const POST = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const body = await req.json();

  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    throw parsed.error;
  }

  const { email, password, firstName, lastName, dateOfBirth, address } =
    parsed.data;

  const exists = await User.findOne({
    email,
  });

  if (exists) {
    throw new ApiError(409, "User Already exists", [
      { path: "email", message: "Email is already registered." },
    ]);
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    email,
    password: hashedPassword,
    firstName,
    lastName,
    dateOfBirth: new Date(dateOfBirth),
    address,
    provider: "credentials",
  });

  const safeUser = {
    _id: user._id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
    provider: user.provider,
  };

  return apiSuccess(201, safeUser, "User registered successfully.");
});
