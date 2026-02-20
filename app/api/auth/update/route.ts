import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { updateSchema } from "@/verification/auth.verification";
import { NextRequest } from "next/server";

export const PATCH = withApiHandler(async (req: NextRequest) => {
  await dbConnect();

  const body = await req.json();

  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    throw parsed.error;
  }

  const { email, firstName, lastName, dateOfBirth, address } = parsed.data;

  const exist = await User.findOne({
    email,
  });

  if (!exist) {
    throw new ApiError(404, "User not found.");
  }

  await User.updateOne(
    { email },
    {
      email,
      firstName,
      lastName,
      dateOfBirth,
      address,
    },
  );

  const user = await User.findOne({
    email,
  }).select({
    _id: true,
    firstName: true,
    lastName: true,
    email: true,
    role: true,
    address: true,
    dateOfBirth: true,
    image: true,
  });

  return apiSuccess(200, user, "User updated successfully.");
});
