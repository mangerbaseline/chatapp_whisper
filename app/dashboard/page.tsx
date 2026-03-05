"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import DashboardHeader from "@/components/DashboardHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
} from "recharts";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  Activity,
  Shield,
  IndianRupee,
  Coins,
  ArrowLeftRight,
} from "lucide-react";

const registrationChartConfig = {
  users: {
    label: "Registrations",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

const activityChartConfig = {
  Active: {
    label: "Active",
    color: "oklch(0.72 0.19 149.58)",
  },
  Deactivated: {
    label: "Deactivated",
    color: "oklch(0.64 0.21 25.33)",
  },
} satisfies ChartConfig;

const statusChartConfig = {
  Enabled: {
    label: "Enabled",
    color: "var(--color-chart-1)",
  },
  Disabled: {
    label: "Disabled",
    color: "var(--color-chart-4)",
  },
} satisfies ChartConfig;

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig;

interface DashboardData {
  totalUsers: number;
  activeUsers: number;
  deactivatedUsers: number;
  todaysActiveUsers: number;
  enabledUsers: number;
  disabledUsers: number;
  monthlyRegistrations: { month: string; year: number; users: number }[];
  activityDistribution: { name: string; value: number }[];
  statusDistribution: { name: string; value: number }[];
  providerDistribution: { name: string; value: number }[];
  recentUsers: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    image?: string;
    isActive: boolean;
    isDeactivated?: boolean;
    consecutiveLoginDays?: number;
    createdAt: string;
    provider?: string;
  }[];
  totalRevenue: number;
  totalTokensSold: number;
  totalTransactions: number;
  monthlyRevenue: { month: string; year: number; revenue: number }[];
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

const PIE_COLORS = ["oklch(0.72 0.19 149.58)", "oklch(0.64 0.21 25.33)"];

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accentClass,
  delay,
  href,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  delay: number;
  href?: string;
}) {
  const cardContent = (
    <Card
      className="relative overflow-hidden opacity-0 animate-fade-in group hover:shadow-lg transition-all duration-300 h-full"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 opacity-[0.04] ${accentClass}`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={`p-2 rounded-lg ${accentClass} transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block cursor-pointer">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <Skeleton className="h-6 w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/admin/dashboard")
      .then((res) => setData(res.data.data))
      .catch((err) => console.error("Dashboard fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <DashboardSkeleton />;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-400 mx-auto">
      <div className="flex flex-col gap-1">
        <DashboardHeader />
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" />
          Real-time overview of your platform
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={data.totalUsers}
          description="All registered users"
          icon={Users}
          accentClass="bg-primary"
          delay={0}
          href="/dashboard/admin-users"
        />
        <StatCard
          title="Active Users"
          value={data.activeUsers}
          description="Currently active accounts"
          icon={UserCheck}
          accentClass="bg-emerald-500"
          delay={100}
          href="/dashboard/admin-users"
        />
        <StatCard
          title="Deactivated Users"
          value={data.deactivatedUsers}
          description="Inactive for 45+ days"
          icon={UserX}
          accentClass="bg-red-500"
          delay={200}
          href="/dashboard/admin-users"
        />
        <StatCard
          title="Today's Active"
          value={data.todaysActiveUsers}
          description="Logged in today"
          icon={Clock}
          accentClass="bg-amber-500"
          delay={300}
          href="/dashboard/admin-users"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Revenue"
          value={data.totalRevenue / 100}
          description="Lifetime purchase revenue"
          icon={IndianRupee}
          accentClass="bg-teal-500"
          delay={400}
          href="/dashboard/transactions"
        />
        <StatCard
          title="Tokens Sold"
          value={data.totalTokensSold}
          description="Total tokens purchased"
          icon={Coins}
          accentClass="bg-violet-500"
          delay={500}
          href="/dashboard/transactions"
        />
        <StatCard
          title="Transactions"
          value={data.totalTransactions}
          description="All token transactions"
          icon={ArrowLeftRight}
          accentClass="bg-blue-500"
          delay={600}
          href="/dashboard/transactions"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        <Card
          className="lg:col-span-4 opacity-0 animate-fade-in"
          style={{ animationDelay: "200ms" }}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  User Registrations
                </CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={registrationChartConfig}
              className="h-65 w-full"
            >
              <BarChart
                data={data.monthlyRegistrations}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="users"
                  fill="var(--color-chart-1)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card
          className="lg:col-span-3 opacity-0 animate-fade-in"
          style={{ animationDelay: "300ms" }}
        >
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Activity Distribution
            </CardTitle>
            <CardDescription>User activity breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ChartContainer
              config={activityChartConfig}
              className="h-50 w-full max-w-70"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={data.activityDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  strokeWidth={2}
                  stroke="var(--color-background)"
                >
                  {data.activityDistribution.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
            <div className="flex gap-6 mt-2 text-sm">
              {data.activityDistribution.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i] }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        <Card
          className="lg:col-span-4 opacity-0 animate-fade-in"
          style={{ animationDelay: "350ms" }}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-primary" />
                  Monthly Revenue
                </CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="h-65 w-full">
              <BarChart
                data={data.monthlyRevenue.map((item) => ({
                  ...item,
                  revenue: item.revenue / 100,
                }))}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-chart-2)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card
          className="lg:col-span-3 opacity-0 animate-fade-in"
          style={{ animationDelay: "400ms" }}
        >
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Account Status
            </CardTitle>
            <CardDescription>Enabled vs Disabled accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusChartConfig} className="h-55 w-full">
              <BarChart
                data={data.statusDistribution}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="opacity-30"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 13 }}
                  width={70}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={36}>
                  {data.statusDistribution.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.name === "Enabled"
                          ? "var(--color-chart-1)"
                          : "var(--color-chart-4)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <div className="flex items-center justify-center gap-6 mt-3 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-chart-1" />
                <span className="text-muted-foreground">Enabled</span>
                <span className="font-semibold">{data.enabledUsers}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-chart-4" />
                <span className="text-muted-foreground">Disabled</span>
                <span className="font-semibold">{data.disabledUsers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="lg:col-span-4 opacity-0 animate-fade-in"
          style={{ animationDelay: "500ms" }}
        >
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Recent Users
            </CardTitle>
            <CardDescription>Latest registered users</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Activity
                  </TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentUsers.map((user) => (
                  <TableRow key={user._id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {user.firstName?.[0] || ""}
                            {(
                              user.lastName?.[0] ||
                              user.email[0] ||
                              ""
                            ).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.firstName
                              ? `${user.firstName} ${user.lastName || ""}`
                              : user.email}
                          </p>
                          <p className="text-xs text-muted-foreground truncate hidden sm:block">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={user.isActive ? "default" : "destructive"}
                        className="text-[11px]"
                      >
                        {user.isActive ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant="outline"
                        className={
                          user.isDeactivated
                            ? "border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30"
                            : "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30"
                        }
                      >
                        {user.isDeactivated ? "Deactivated" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(new Date(user.createdAt))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
