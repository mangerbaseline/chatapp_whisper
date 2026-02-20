"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  BarChart3,
} from "lucide-react";

const iconMap = {
  "dollar-sign": DollarSign,
  users: Users,
  activity: Activity,
  "trending-up": TrendingUp,
  "bar-chart": BarChart3,
};

type IconName = keyof typeof iconMap;

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: IconName;
  trend: "up" | "down";
  className?: string;
  delay?: number;
}

export function StatCard({
  title,
  value,
  change,
  icon,
  trend,
  className,
  delay = 0,
}: StatCardProps) {
  const Icon = iconMap[icon];
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/50 bg-card hover:shadow-lg transition-all duration-300 opacity-0 animate-fade-in py-0",
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {value}
            </p>
            <div className="flex items-center gap-1">
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-accent" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  trend === "up" ? "text-accent" : "text-destructive",
                )}
              >
                {change > 0 ? "+" : ""}
                {change}%
              </span>
              <span className="text-sm text-muted-foreground">
                vs last month
              </span>
            </div>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              trend === "up"
                ? "bg-primary/10 text-primary"
                : "bg-destructive/10 text-destructive",
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
