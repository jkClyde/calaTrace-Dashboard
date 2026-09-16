"use client";

import { useRouter } from "next/navigation";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function TransportRow({
  batchId,
  originPoint,
  destinationPoint,
  transporterName,
  departedAt,
  arrivedAt,
}: {
  batchId: string;
  originPoint: string | null;
  destinationPoint: string | null;
  transporterName: string;
  departedAt: string | null;
  arrivedAt: string | null;
}) {
  const router = useRouter();
  const hours =
    departedAt && arrivedAt
      ? (new Date(arrivedAt).getTime() - new Date(departedAt).getTime()) / 3_600_000
      : null;

  return (
    <TableRow className="cursor-pointer" onClick={() => router.push(`/dashboard/batches/${batchId}`)}>
      <TableCell className="font-medium text-foreground">
        {originPoint} → {destinationPoint}
      </TableCell>
      <TableCell>{transporterName}</TableCell>
      <TableCell className="text-muted-foreground">
        {departedAt ? new Date(departedAt).toLocaleDateString() : "—"}
      </TableCell>
      <TableCell>
        <Badge variant={arrivedAt ? "secondary" : "default"}>{arrivedAt ? "Completed" : "In transit"}</Badge>
      </TableCell>
      <TableCell className="font-mono">{hours !== null ? `${hours.toFixed(1)}h` : "—"}</TableCell>
    </TableRow>
  );
}
