"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Direct", value: 35, color: "hsl(217, 91%, 60%)" },
  { name: "Organic ", value: 28, color: "hsl(172, 66%, 50%)" },
  { name: "Social ", value: 22, color: "hsl(43, 96%, 56%)" },
  { name: "Referral", value: 15, color: "hsl(262, 83%, 58%)" },
];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-popover p-3 shadow-xl">
        <p className="text-sm text-foreground">
          {payload[0].name}:{" "}
          <span className="font-semibold">{payload[0].value}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export function TrafficSources() {
  return (
    <Card
      className="border-border/50 bg-card opacity-0 animate-fade-in lg:col-span-1 col-span-2"
      style={{ animationDelay: "300ms" }}
    >
      <CardHeader>
        <CardTitle className="text-foreground">Traffic Sources</CardTitle>
        <CardDescription className="text-muted-foreground">
          Where your visitors come from
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    strokeWidth={0}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">{item.name}</span>
              <span className="ml-auto text-sm font-medium text-foreground">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
