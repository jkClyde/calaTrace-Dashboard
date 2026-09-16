import { Badge } from "@/components/ui/badge";
import { stageColors, type BatchStage } from "@/lib/theme";

const STAGE_LABELS: Record<BatchStage, string> = {
  harvested: "Harvested",
  consolidated: "Consolidated",
  in_transit: "In transit",
  received: "Received",
  rejected: "Rejected",
};

export default function StageBadge({ stage }: { stage: BatchStage }) {
  const color = stageColors[stage];
  return (
    <Badge
      variant="outline"
      className="border-transparent font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {STAGE_LABELS[stage] ?? stage}
    </Badge>
  );
}
