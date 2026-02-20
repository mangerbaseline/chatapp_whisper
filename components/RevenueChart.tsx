"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", revenue: 18500, users: 2400 },
  { month: "Feb", revenue: 22300, users: 2800 },
  { month: "Mar", revenue: 28100, users: 3200 },
  { month: "Apr", revenue: 25400, users: 3000 },
  { month: "May", revenue: 32000, users: 3800 },
  { month: "Jun", revenue: 38500, users: 4200 },
  { month: "Jul", revenue: 42000, users: 4800 },
  { month: "Aug", revenue: 45200, users: 5200 },
  { month: "Sep", revenue: 48700, users: 5600 },
  { month: "Oct", revenue: 52100, users: 6000 },
  { month: "Nov", revenue: 55800, users: 6400 },
  { month: "Dec", revenue: 62000, users: 7200 },
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-popover p-3 shadow-xl">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-muted-foreground">
            {entry.dataKey === "revenue" ? "Revenue: " : "Users: "}
            <span className="font-semibold text-foreground">
              {entry.dataKey === "revenue"
                ? `$${entry.value.toLocaleString()}`
                : entry.value.toLocaleString()}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function RevenueChart() {
  const primaryColor = "hsl(217, 91%, 60%)";
  const accentColor = "hsl(172, 66%, 50%)";

  return (
    <Card
      className="col-span-2 border-border/50 bg-card opacity-0 animate-fade-in"
      style={{ animationDelay: "200ms" }}
    >
      <CardHeader>
        <CardTitle className="text-foreground">Revenue & Growth</CardTitle>
        <CardDescription className="text-muted-foreground">
          Monthly revenue and user acquisition trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-50">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={primaryColor}
                    stopOpacity={0.3}
                  />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accentColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(240, 5.9%, 90%)"
              />
              <XAxis
                dataKey="month"
                stroke="hsl(240, 3.8%, 46.1%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(240, 3.8%, 46.1%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={primaryColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke={accentColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorUsers)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <span className="text-sm text-muted-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <span className="text-sm text-muted-foreground">Users</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
