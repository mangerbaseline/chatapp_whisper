import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { updateSchema } from "@/verification/auth.verification";
import { NextRequest } from "next/server";

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  await dbConnect();

  const body = await req.json();

  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    throw parsed.error;
  }

  const { email, firstName, lastName, dateOfBirth, address, mobileNo } =
    parsed.data;

  const exist = await User.findOne({
    _id: userId,
  });

  if (!exist) {
    throw new ApiError(404, "User not found.");
  }

  await User.updateOne(
    { _id: userId },
    {
      email,
      firstName,
      lastName,
      dateOfBirth,
      address,
      mobileNo: mobileNo || undefined,
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
    mobileNo: true,
    bankAccountStatus: true,
    linkedBankLast4: true,
    linkedBankName: true,
  });

  return apiSuccess(200, user, "User updated successfully.");
});
