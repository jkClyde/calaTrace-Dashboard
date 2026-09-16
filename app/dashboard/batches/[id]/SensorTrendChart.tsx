"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

type Reading = { recorded_at: string; temperature_c: number | null };

const chartConfig: ChartConfig = {
  temperature_c: { label: "Temperature", color: "var(--primary-dark)" },
};

export default function SensorTrendChart({ readings }: { readings: Reading[] }) {
  const formatted = [...readings].reverse().map((r) => ({
    label: new Date(r.recorded_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    temperature_c: r.temperature_c,
  }));

  if (!formatted.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No sensor readings yet.</p>;
  }

  return (
    <ChartContainer config={chartConfig} className="h-[180px] w-full">
      <LineChart data={formatted} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
        <CartesianGrid strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} unit="°C" />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Line
          type="monotone"
          dataKey="temperature_c"
          stroke="var(--color-temperature_c)"
          strokeWidth={2}
          dot={{ r: 2, fill: "var(--color-temperature_c)", strokeWidth: 0 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
