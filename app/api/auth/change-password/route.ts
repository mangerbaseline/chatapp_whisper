import dbConnect from "@/lib/dbConnect";
import { comparePassword, hashPassword } from "@/lib/hash";
import User from "@/models/User";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { updatePasswordSchema } from "@/verification/auth.verification";
import { NextRequest } from "next/server";

export const PATCH = withApiHandler(async (req: NextRequest) => {
  await dbConnect();

  const body = await req.json();
  const _id = req.headers.get("x-user-id");

  const parsed = updatePasswordSchema.safeParse(body);

  if (!parsed.success) {
    throw parsed.error;
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await User.findById({
    _id,
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const compare = await comparePassword(currentPassword, user.password!);

  if (!compare) {
    throw new ApiError(401, "Incorrect Credentials");
  }

  const hashedPassword = await hashPassword(newPassword);

  await User.updateOne(
    {
      _id: user._id,
    },
    {
      password: hashedPassword,
    },
  );

  return apiSuccess(200, null, "Password updated successfully.");
});
