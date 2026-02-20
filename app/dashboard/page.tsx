"use client";

import DashboardHeader from "@/components/DashboardHeader";
import { QuickActions } from "@/components/QuickActions";
import { RecentActivity } from "@/components/RecentActivity";
import { RevenueChart } from "@/components/RevenueChart";
import { StatCard } from "@/components/StatCard";
import { TrafficSources } from "@/components/TrafficSources";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

export default function page() {
  const performanceData = [
    { subject: "Speed", A: 85, fullMark: 100 },
    { subject: "Security", A: 92, fullMark: 100 },
    { subject: "SEO", A: 78, fullMark: 100 },
    { subject: "Accessibility", A: 88, fullMark: 100 },
    { subject: "Best Practices", A: 95, fullMark: 100 },
    { subject: "PWA", A: 70, fullMark: 100 },
  ];
  const stats = [
    {
      title: "Total Revenue",
      value: "$62,400",
      change: 12.5,
      icon: "dollar-sign" as const,
      trend: "up" as const,
    },
    {
      title: "Active Users",
      value: "7,245",
      change: 8.2,
      icon: "users" as const,
      trend: "up" as const,
    },
    {
      title: "Conversion Rate",
      value: "4.28%",
      change: -2.1,
      icon: "activity" as const,
      trend: "down" as const,
    },
    {
      title: "Growth Rate",
      value: "24.5%",
      change: 18.3,
      icon: "trending-up" as const,
      trend: "up" as const,
    },
  ];

  const primaryColor = "hsl(217, 91%, 60%)";
  const accentColor = "hsl(172, 66%, 50%)";
  const chartYellow = "hsl(43, 96%, 56%)";

  return (
    <>
      <DashboardHeader />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6 mt-2">
        {stats.map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={index * 100} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <RevenueChart />
        <TrafficSources />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity />

        <div className="grid gap-6 grid-cols-2 content-start">
          <div
            className="col-span-2 rounded-xl bg-linear-to-br from-primary to-primary/80 p-6 text-primary-foreground opacity-0 animate-fade-in"
            style={{ animationDelay: "500ms" }}
          >
            <h3 className="text-lg font-semibold mb-2">Pro Tip</h3>
            <p className="text-sm text-primary-foreground/80 mb-4">
              Increase engagement by 40% with personalized user onboarding
              flows.
            </p>
            <button className="text-sm font-medium underline underline-offset-4 hover:no-underline">
              Learn more
            </button>
          </div>

          <div
            className="rounded-xl border border-border/50 bg-card p-6 opacity-0 animate-fade-in"
            style={{ animationDelay: "600ms" }}
          >
            <p className="text-sm text-muted-foreground">Avg. Session</p>
            <p className="text-2xl font-bold text-foreground mt-1">4m 32s</p>
            <p className="text-xs text-accent mt-2">+12% from last week</p>
          </div>

          <div
            className="rounded-xl border border-border/50 bg-card p-6 opacity-0 animate-fade-in"
            style={{ animationDelay: "700ms" }}
          >
            <p className="text-sm text-muted-foreground">Bounce Rate</p>
            <p className="text-2xl font-bold text-foreground mt-1">32.4%</p>
            <p className="text-xs text-destructive mt-2">-5% from last week</p>
          </div>

          <QuickActions />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2 mt-3">
        <Card
          className="border-border/50 bg-card opacity-0 animate-fade-in"
          style={{ animationDelay: "200ms" }}
        >
          <CardHeader>
            <CardTitle className="text-foreground">Performance Score</CardTitle>
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
            <CardTitle className="text-foreground">Score Breakdown</CardTitle>
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
                  <span className="text-muted-foreground">{item.A}/100</span>
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
    </>
  );
}
