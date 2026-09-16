"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import StageBadge from "@/components/StageBadge";
import { Badge } from "@/components/ui/badge";
import type { BatchStage } from "@/lib/theme";

export default function BatchRow({
  id,
  qrToken,
  farmerName,
  stage,
  syncStatus,
  createdAt,
}: {
  id: string;
  qrToken: string | null;
  farmerName: string;
  stage: BatchStage;
  syncStatus: string | null;
  createdAt: string;
}) {
  const router = useRouter();

  return (
    <TableRow className="cursor-pointer" onClick={() => router.push(`/dashboard/batches/${id}`)}>
      <TableCell className="font-mono text-xs">{qrToken ?? id.slice(0, 8)}</TableCell>
      <TableCell>{farmerName}</TableCell>
      <TableCell>
        <StageBadge stage={stage} />
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-muted-foreground">
          {syncStatus ?? "—"}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{new Date(createdAt).toLocaleDateString()}</TableCell>
      <TableCell className="w-8">
        <ChevronRight size={16} className="text-muted-foreground" />
      </TableCell>
    </TableRow>
  );
}
