import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
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
      activityStatus: true,
      lastSeen: true,
      createdAt: true,
      provider: true,
    })
    .sort({ createdAt: -1 });

  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter(
    (u) => u.activityStatus === "active",
  ).length;
  const idleUsers = allUsers.filter((u) => u.activityStatus === "idle").length;
  const inactiveUsers = allUsers.filter(
    (u) => u.activityStatus === "inactive",
  ).length;
  const enabledUsers = allUsers.filter((u) => u.isActive).length;
  const disabledUsers = allUsers.filter((u) => !u.isActive).length;

  const now = new Date();
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

  return apiSuccess(
    200,
    {
      totalUsers,
      activeUsers,
      idleUsers,
      inactiveUsers,
      enabledUsers,
      disabledUsers,
      monthlyRegistrations,
      activityDistribution: [
        { name: "Active", value: activeUsers },
        { name: "Idle", value: idleUsers },
        { name: "Inactive", value: inactiveUsers },
      ],
      statusDistribution: [
        { name: "Enabled", value: enabledUsers },
        { name: "Disabled", value: disabledUsers },
      ],
      providerDistribution,
      recentUsers,
    },
    "Dashboard data fetched successfully.",
  );
});
