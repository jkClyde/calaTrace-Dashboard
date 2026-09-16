"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { stageColors, type BatchStage } from "@/lib/theme";

type StageRow = { stage: BatchStage; batch_count: number };

const STAGE_LABELS: Record<BatchStage, string> = {
  harvested: "Harvested",
  consolidated: "Consolidated",
  in_transit: "In transit",
  received: "Received",
  rejected: "Rejected",
};

const chartConfig: ChartConfig = {
  batch_count: { label: "Batches" },
};

export default function StageChart({ data }: { data: StageRow[] }) {
  if (!data.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No batches yet.</p>;
  }

  return (
    <>
      <ChartContainer config={chartConfig} className="h-[220px] w-full">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="stage"
            tickFormatter={(v: BatchStage) => STAGE_LABELS[v] ?? v}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <ChartTooltip
            content={<ChartTooltipContent hideLabel nameKey="stage" formatter={(value) => <span className="font-mono font-medium">{value} batches</span>} />}
          />
          <Bar dataKey="batch_count" radius={[6, 6, 0, 0]}>
            {data.map((row) => (
              <Cell key={row.stage} fill={stageColors[row.stage] ?? "var(--branding)"} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <div className="mt-3 flex flex-wrap gap-4">
        {data.map((row) => (
          <div key={row.stage} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: stageColors[row.stage] }} />
            {STAGE_LABELS[row.stage] ?? row.stage}
          </div>
        ))}
      </div>
    </>
  );
}
