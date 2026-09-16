import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import TransportRow from "./TransportRow";

const PAGE_SIZE = 20;

export const dynamic = "force-dynamic";

export default async function TransportPage({
  searchParams,
}: {
  searchParams: { page?: string; transporter?: string };
}) {
  const supabase = createClient();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const transporter = searchParams.transporter;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("transport_records")
    .select("id, batch_id, transporter_id, origin_point, destination_point, departed_at, arrived_at", {
      count: "exact",
    })
    .order("departed_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (transporter) query = query.eq("transporter_id", transporter);

  const { data: records, count } = await query;

  const transporterIds = Array.from(new Set((records ?? []).map((r) => r.transporter_id).filter(Boolean)));
  const { data: transporters } =
    transporterIds.length > 0
      ? await supabase.from("profiles").select("id, name").in("id", transporterIds)
      : { data: [] as { id: string; name: string }[] };
  const transporterName = new Map((transporters ?? []).map((t) => [t.id, t.name]));
  const filteredName = transporter ? transporterName.get(transporter) : null;

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (transporter) params.set("transporter", transporter);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/dashboard/transport${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">Transport</h1>
          <p className="text-sm text-muted-foreground">{count ?? 0} delivery records</p>
        </div>
        {transporter && (
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/transport">
              Clear filter{filteredName ? `: ${filteredName}` : ""}
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All deliveries</CardTitle>
          <CardDescription>Click a row to view its batch</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Transporter</TableHead>
                <TableHead>Departed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transit time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(records ?? []).map((r) => (
                <TransportRow
                  key={r.id}
                  batchId={r.batch_id}
                  originPoint={r.origin_point}
                  destinationPoint={r.destination_point}
                  transporterName={transporterName.get(r.transporter_id) ?? "Unknown"}
                  departedAt={r.departed_at}
                  arrivedAt={r.arrived_at}
                />
              ))}
            </TableBody>
          </Table>
          {!records?.length && (
            <p className="py-10 text-center text-sm text-muted-foreground">No transport records match this filter.</p>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={pageHref(Math.max(1, page - 1))}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    tabIndex={page <= 1 ? -1 : undefined}
                  >
                    Previous
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={pageHref(Math.min(totalPages, page + 1))}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                    tabIndex={page >= totalPages ? -1 : undefined}
                  >
                    Next
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
