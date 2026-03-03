import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import TokenTransaction from "@/models/TokenTransaction";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { NextRequest } from "next/server";

export const GET = withApiHandler<{ id: string }>(
  async (req: NextRequest, { params }) => {
    await dbConnect();

    const adminId = req.headers.get("x-user-id");
    if (!adminId) {
      throw new ApiError(401, "Unauthorized");
    }

    const admin = await User.findById(adminId).select("role");
    if (!admin || admin.role !== "ADMIN") {
      throw new ApiError(401, "Unauthorized");
    }

    const { id } = await params;

    const targetUser = await User.findById(id).select(
      "-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpiry -__v",
    );

    if (!targetUser) {
      throw new ApiError(404, "User not found.");
    }

    const spendingAgg = await TokenTransaction.aggregate([
      { $match: { user: targetUser._id, type: "purchase" } },
      { $group: { _id: null, totalSpent: { $sum: "$amountMoney" } } },
    ]);
    const totalSpending =
      spendingAgg.length > 0 ? spendingAgg[0].totalSpent : 0;

    const recentTransactions = await TokenTransaction.find({
      user: targetUser._id,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("plan", "name price tokens")
      .populate("fromUser", "firstName lastName email")
      .populate("toUser", "firstName lastName email")
      .lean();

    return apiSuccess(
      200,
      {
        user: targetUser,
        totalSpending,
        recentTransactions,
      },
      "User details fetched successfully.",
    );
  },
);
