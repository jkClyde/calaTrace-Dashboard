import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BatchRow from "./BatchRow";
import BatchSearch from "./BatchSearch";
import type { BatchStage } from "@/lib/theme";

const PAGE_SIZE = 20;

const STAGES: BatchStage[] = ["harvested", "consolidated", "in_transit", "received", "rejected"];

export const dynamic = "force-dynamic";

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: { q?: string; stage?: string; farmer?: string; page?: string };
}) {
  const supabase = createClient();
  const q = searchParams.q ?? "";
  const stage = searchParams.stage;
  const farmer = searchParams.farmer;
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("batches")
    .select("id, qr_token, farmer_id, stage, sync_status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) query = query.ilike("qr_token", `%${q}%`);
  if (stage) query = query.eq("stage", stage);
  if (farmer) query = query.eq("farmer_id", farmer);

  const { data: batches, count } = await query;

  const farmerIds = Array.from(new Set((batches ?? []).map((b) => b.farmer_id).filter(Boolean)));
  const { data: farmers } =
    farmerIds.length > 0
      ? await supabase.from("profiles").select("id, name").in("id", farmerIds)
      : { data: [] as { id: string; name: string }[] };
  const farmerName = new Map((farmers ?? []).map((f) => [f.id, f.name]));

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (stage) params.set("stage", stage);
    if (farmer) params.set("farmer", farmer);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/dashboard/batches${qs ? `?${qs}` : ""}`;
  }

  function stageHref(s: BatchStage | null) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (s) params.set("stage", s);
    if (farmer) params.set("farmer", farmer);
    const qs = params.toString();
    return `/dashboard/batches${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">Batches</h1>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>
        <BatchSearch initialQuery={q} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={stageHref(null)}>
          <Badge variant={!stage ? "default" : "secondary"} className="cursor-pointer">
            All
          </Badge>
        </Link>
        {STAGES.map((s) => (
          <Link key={s} href={stageHref(s)}>
            <Badge variant={stage === s ? "default" : "secondary"} className="cursor-pointer capitalize">
              {s.replace("_", " ")}
            </Badge>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All batches</CardTitle>
          <CardDescription>Click any row to view its full detail, sensor history, and transport record</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>QR token</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Sync</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(batches ?? []).map((b) => (
                <BatchRow
                  key={b.id}
                  id={b.id}
                  qrToken={b.qr_token}
                  farmerName={farmerName.get(b.farmer_id) ?? "Unknown"}
                  stage={b.stage}
                  syncStatus={b.sync_status}
                  createdAt={b.created_at}
                />
              ))}
            </TableBody>
          </Table>
          {!batches?.length && (
            <p className="py-10 text-center text-sm text-muted-foreground">No batches match this filter.</p>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" disabled={page <= 1}>
                  <Link
                    href={pageHref(Math.max(1, page - 1))}
                    aria-disabled={page <= 1}
                    tabIndex={page <= 1 ? -1 : undefined}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  >
                    Previous
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={pageHref(Math.min(totalPages, page + 1))}
                    aria-disabled={page >= totalPages}
                    tabIndex={page >= totalPages ? -1 : undefined}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
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
