"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    user: "Sarah Chen",
    action: "upgraded to Pro plan",
    time: "2 minutes ago",
    avatar: "SC",
    type: "upgrade",
  },
  {
    id: 2,
    user: "Michael Park",
    action: "created new project",
    time: "15 minutes ago",
    avatar: "MP",
    type: "create",
  },
  {
    id: 3,
    user: "Emma Wilson",
    action: "completed onboarding",
    time: "32 minutes ago",
    avatar: "EW",
    type: "complete",
  },
  {
    id: 4,
    user: "David Kim",
    action: "invited 3 team members",
    time: "1 hour ago",
    avatar: "DK",
    type: "invite",
  },
  {
    id: 5,
    user: "Lisa Anderson",
    action: "exported analytics report",
    time: "2 hours ago",
    avatar: "LA",
    type: "export",
  },
];

const typeColors: Record<string, string> = {
  upgrade: "bg-primary/20 text-primary",
  create: "bg-accent/20 text-accent",
  complete: "bg-chart-3/20 text-chart-3",
  invite: "bg-chart-4/20 text-chart-4",
  export: "bg-muted text-muted-foreground",
};

export function RecentActivity() {
  return (
    <Card
      className="border-border/50 bg-card opacity-0 animate-fade-in"
      style={{ animationDelay: "400ms" }}
    >
      <CardHeader>
        <CardTitle className="text-foreground">Recent Activity</CardTitle>
        <CardDescription className="text-muted-foreground">
          Latest user actions on your platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={cn(
              "flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors opacity-0 animate-slide-in",
            )}
            style={{ animationDelay: `${500 + index * 100}ms` }}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {activity.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {activity.user}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {activity.action}
              </p>
            </div>
            <div className="text-right">
              <Badge
                variant="secondary"
                className={cn("text-xs", typeColors[activity.type])}
              >
                {activity.type}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
