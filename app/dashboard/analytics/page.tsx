"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const weeklyData = [
  { day: "Mon", pageViews: 4200, sessions: 2400, bounceRate: 32 },
  { day: "Tue", pageViews: 3800, sessions: 2100, bounceRate: 35 },
  { day: "Wed", pageViews: 5100, sessions: 2800, bounceRate: 28 },
  { day: "Thu", pageViews: 4700, sessions: 2600, bounceRate: 30 },
  { day: "Fri", pageViews: 5800, sessions: 3200, bounceRate: 25 },
  { day: "Sat", pageViews: 3200, sessions: 1800, bounceRate: 38 },
  { day: "Sun", pageViews: 2900, sessions: 1600, bounceRate: 40 },
];

const performanceData = [
  { subject: "Speed", A: 85, fullMark: 100 },
  { subject: "Security", A: 92, fullMark: 100 },
  { subject: "SEO", A: 78, fullMark: 100 },
  { subject: "Accessibility", A: 88, fullMark: 100 },
  { subject: "Best Practices", A: 95, fullMark: 100 },
  { subject: "PWA", A: 70, fullMark: 100 },
];

const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  visitors: Math.floor(Math.random() * 500) + 100,
}));

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-popover p-3 shadow-xl">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="text-sm text-muted-foreground flex items-center gap-2"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.dataKey}:{" "}
            <span className="font-semibold text-foreground">
              {entry.value.toLocaleString()}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const metrics = [
  { label: "Page Views", value: "29.7K", change: "+12.3%", positive: true },
  { label: "Unique Visitors", value: "16.5K", change: "+8.7%", positive: true },
  { label: "Avg. Duration", value: "3m 42s", change: "+5.2%", positive: true },
  { label: "Bounce Rate", value: "32.4%", change: "-2.1%", positive: true },
];

export default function AnalyticsPage() {
  const primaryColor = "hsl(217, 91%, 60%)";
  const accentColor = "hsl(172, 66%, 50%)";
  const chartYellow = "hsl(43, 96%, 56%)";

  return (
    <>
      <span className="text-md font-semibold mb-2">
        Welcome back, Here's what's happening.
      </span>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {metrics.map((metric, index) => (
          <Card
            key={metric.label}
            className="border-border/50 bg-card opacity-0 animate-fade-in py-0"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-foreground">
                  {metric.value}
                </span>
                <Badge
                  variant="secondary"
                  className={
                    metric.positive
                      ? "bg-accent/20 text-accent"
                      : "bg-destructive/20 text-destructive"
                  }
                >
                  {metric.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="weekly" className="space-y-6">
        <TabsList>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="hourly">Hourly</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card
              className="border-border/50 bg-card opacity-0 animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              <CardHeader>
                <CardTitle className="text-foreground">
                  Page Views & Sessions
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Weekly traffic breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-75">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(240, 5.9%, 90%)"
                      />
                      <XAxis
                        dataKey="day"
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
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="pageViews"
                        fill={primaryColor}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="sessions"
                        fill={accentColor}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="text-sm text-muted-foreground">
                      Page Views
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span className="text-sm text-muted-foreground">
                      Sessions
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-border/50 bg-card opacity-0 animate-fade-in"
              style={{ animationDelay: "300ms" }}
            >
              <CardHeader>
                <CardTitle className="text-foreground">
                  Bounce Rate Trend
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Lower is better
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-75">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(240, 5.9%, 90%)"
                      />
                      <XAxis
                        dataKey="day"
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
                        domain={[0, 50]}
                        unit="%"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="bounceRate"
                        stroke={chartYellow}
                        strokeWidth={3}
                        dot={{ fill: chartYellow, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: chartYellow }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hourly">
          <Card
            className="border-border/50 bg-card opacity-0 animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            <CardHeader>
              <CardTitle className="text-foreground">Hourly Visitors</CardTitle>
              <CardDescription className="text-muted-foreground">
                Real-time visitor distribution across 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-100">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(240, 5.9%, 90%)"
                    />
                    <XAxis
                      dataKey="hour"
                      stroke="hsl(240, 3.8%, 46.1%)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval={2}
                    />
                    <YAxis
                      stroke="hsl(240, 3.8%, 46.1%)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="visitors"
                      fill={primaryColor}
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card
              className="border-border/50 bg-card opacity-0 animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              <CardHeader>
                <CardTitle className="text-foreground">
                  Performance Score
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Lighthouse metrics overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-87.5">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      data={performanceData}
                    >
                      <PolarGrid stroke="hsl(240, 5.9%, 90%)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "hsl(240, 3.8%, 46.1%)", fontSize: 12 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: "hsl(240, 3.8%, 46.1%)", fontSize: 10 }}
                      />
                      <Radar
                        name="Score"
                        dataKey="A"
                        stroke={primaryColor}
                        fill={primaryColor}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-border/50 bg-card opacity-0 animate-fade-in"
              style={{ animationDelay: "300ms" }}
            >
              <CardHeader>
                <CardTitle className="text-foreground">
                  Score Breakdown
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Individual metric scores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {performanceData.map((item, index) => (
                  <div
                    key={item.subject}
                    className="space-y-2 opacity-0 animate-slide-in"
                    style={{ animationDelay: `${400 + index * 100}ms` }}
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground font-medium">
                        {item.subject}
                      </span>
                      <span className="text-muted-foreground">
                        {item.A}/100
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${item.A}%`,
                          backgroundColor:
                            item.A >= 90
                              ? accentColor
                              : item.A >= 70
                                ? primaryColor
                                : chartYellow,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
