"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

type AlertRow = { bucket: string; alert_count: number };

const PERIODS = ["Daily", "Weekly", "Monthly"] as const;
type Period = (typeof PERIODS)[number];

const chartConfig: ChartConfig = {
  alert_count: { label: "Alerts", color: "var(--branding)" },
};

export default function AlertsChart({
  daily,
  weekly,
  monthly,
  height = 260,
}: {
  daily: AlertRow[];
  weekly: AlertRow[];
  monthly: AlertRow[];
  height?: number;
}) {
  const [period, setPeriod] = useState<Period>("Daily");

  const dataByPeriod: Record<Period, AlertRow[]> = { Daily: daily, Weekly: weekly, Monthly: monthly };
  const formatOptions: Record<Period, Intl.DateTimeFormatOptions> = {
    Daily: { month: "short", day: "numeric" },
    Weekly: { month: "short", day: "numeric" },
    Monthly: { month: "short", year: "2-digit" },
  };

  const formatted = dataByPeriod[period].map((row) => ({
    ...row,
    label: new Date(row.bucket).toLocaleDateString(undefined, formatOptions[period]),
  }));

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 rounded-full bg-secondary p-1">
        {PERIODS.map((p) => (
          <Button
            key={p}
            type="button"
            variant={p === period ? "default" : "ghost"}
            size="sm"
            onClick={() => setPeriod(p)}
            className={`h-7 rounded-full px-3 text-xs ${p === period ? "" : "text-muted-foreground"}`}
          >
            {p}
          </Button>
        ))}
      </div>

      {!formatted.length ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No sensor alerts recorded yet.</p>
      ) : (
        <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
          <AreaChart data={formatted} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
            <defs>
              <linearGradient id="alertsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-alert_count)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-alert_count)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <Area
              type="monotone"
              dataKey="alert_count"
              stroke="var(--color-alert_count)"
              strokeWidth={2.5}
              fill="url(#alertsFill)"
              dot={{ r: 3, fill: "var(--color-alert_count)", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}
