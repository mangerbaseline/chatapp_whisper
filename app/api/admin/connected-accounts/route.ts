import dbConnect from "@/lib/dbConnect";
import { User } from "@/models";
import BankVerificationRequest from "@/models/BankVerificationRequest";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { NextRequest } from "next/server";

export const GET = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");

  if (!userId) throw new ApiError(401, "Unauthorized");

  const admin = await User.findById(userId).select({ role: true });
  if (!admin || admin.role !== "ADMIN") throw new ApiError(403, "Forbidden");

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "";

  const skip = (page - 1) * limit;

  const query: any = {};

  if (statusFilter) {
    query.status = statusFilter;
  }

  let userIds: string[] = [];
  if (search) {
    const searchRegex = new RegExp(search, "i");

    const matchingUsers = await User.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ],
    }).select("_id");

    userIds = matchingUsers.map((u) => u._id.toString());

    query.$or = [
      { user: { $in: userIds } },
      { accountHolderName: searchRegex },
      { bankName: searchRegex },
    ];
  }

  const [requests, total] = await Promise.all([
    BankVerificationRequest.find(query)
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    BankVerificationRequest.countDocuments(query),
  ]);

  return apiSuccess(
    200,
    {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    "Fetched connected accounts.",
  );
});
