import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import TokenTransaction from "@/models/TokenTransaction";
import RefundRequest from "@/models/RefundRequest";
import { ApiError } from "@/utils/api-error";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";
import { NextRequest } from "next/server";

export const GET = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await User.findById(userId).select({ role: true });

  if (!user || user.role !== "ADMIN") {
    throw new ApiError(401, "Unauthorized");
  }

  const allUsers = await User.find({ role: "USER" })
    .select({
      _id: true,
      email: true,
      firstName: true,
      lastName: true,
      image: true,
      isActive: true,
      isDeactivated: true,
      lastSeen: true,
      lastLoginDate: true,
      consecutiveLoginDays: true,
      createdAt: true,
      provider: true,
    })
    .sort({ createdAt: -1 });

  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter(
    (u) => !u.isDeactivated && u.isActive,
  ).length;
  const deactivatedUsers = allUsers.filter((u) => u.isDeactivated).length;

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const todaysActiveUsers = allUsers.filter((u) => {
    if (!u.lastLoginDate) return false;
    return new Date(u.lastLoginDate) >= startOfToday;
  }).length;

  const enabledUsers = allUsers.filter((u) => u.isActive).length;
  const disabledUsers = allUsers.filter((u) => !u.isActive).length;

  const monthlyRegistrations = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() - i + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const count = allUsers.filter((u) => {
      const d = new Date(u.createdAt);
      return d >= start && d <= end;
    }).length;
    monthlyRegistrations.push({
      month: start.toLocaleString("default", { month: "short" }),
      year: start.getFullYear(),
      users: count,
    });
  }

  const recentUsers = allUsers.slice(0, 5);

  const providerCounts = allUsers.reduce(
    (acc: Record<string, number>, u) => {
      const p = u.provider || "credentials";
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const providerDistribution = Object.entries(providerCounts).map(
    ([name, value]) => ({ name, value }),
  );

  const revenueAgg = await TokenTransaction.aggregate([
    { $match: { type: "purchase", amountMoney: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: "$amountMoney" } } },
  ]);
  const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

  const circulationAgg = await TokenTransaction.aggregate([
    { $match: { type: "purchase" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const grossTokensSold =
    circulationAgg.length > 0 ? circulationAgg[0].total : 0;

  const refundedTokensAgg = await RefundRequest.aggregate([
    { $match: { status: { $in: ["refunded", "initiated"] } } },
    { $group: { _id: null, totalTokens: { $sum: "$tokensDeducted" } } },
  ]);
  const totalTokensRefunded =
    refundedTokensAgg.length > 0 ? refundedTokensAgg[0].totalTokens : 0;

  const totalTokensSold = grossTokensSold - totalTokensRefunded;

  const totalTransactions = await TokenTransaction.countDocuments();

  const refundsAgg = await RefundRequest.aggregate([
    { $match: { status: { $in: ["refunded", "initiated"] } } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$refundAmount" },
        count: { $sum: 1 },
      },
    },
  ]);
  const totalRefundedAmount =
    refundsAgg.length > 0 ? refundsAgg[0].totalAmount : 0;
  const totalRefundsCount = refundsAgg.length > 0 ? refundsAgg[0].count : 0;

  const pendingRefunds = await RefundRequest.countDocuments({
    status: "pending",
  });

  const monthlyRevenue = [];
  const monthlyRefunds = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() - i + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const agg = await TokenTransaction.aggregate([
      {
        $match: {
          type: "purchase",
          amountMoney: { $gt: 0 },
          createdAt: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: null, revenue: { $sum: "$amountMoney" } } },
    ]);
    monthlyRevenue.push({
      month: start.toLocaleString("default", { month: "short" }),
      year: start.getFullYear(),
      revenue: agg.length > 0 ? agg[0].revenue : 0,
    });

    const refundAgg = await RefundRequest.aggregate([
      {
        $match: {
          status: { $in: ["refunded", "initiated"] },
          createdAt: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: null, refundedAmount: { $sum: "$refundAmount" } } },
    ]);
    monthlyRefunds.push({
      month: start.toLocaleString("default", { month: "short" }),
      year: start.getFullYear(),
      refundedAmount: refundAgg.length > 0 ? refundAgg[0].refundedAmount : 0,
    });
  }

  return apiSuccess(
    200,
    {
      totalUsers,
      activeUsers,
      deactivatedUsers,
      todaysActiveUsers,
      enabledUsers,
      disabledUsers,
      monthlyRegistrations,
      activityDistribution: [
        { name: "Active", value: activeUsers },
        { name: "Deactivated", value: deactivatedUsers },
      ],
      statusDistribution: [
        { name: "Enabled", value: enabledUsers },
        { name: "Disabled", value: disabledUsers },
      ],
      providerDistribution,
      recentUsers,
      totalRevenue,
      totalTokensSold,
      totalTransactions,
      monthlyRevenue,
      totalRefundedAmount,
      totalRefundsCount,
      pendingRefunds,
      monthlyRefunds,
    },
    "Dashboard data fetched successfully.",
  );
});
