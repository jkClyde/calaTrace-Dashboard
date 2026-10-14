import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StageBadge from "@/components/StageBadge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;
const STAGES = ["harvested", "consolidated", "in_transit", "received", "rejected"];
const STAGE_LABEL: Record<string, string> = {
  harvested: "Harvested",
  consolidated: "Packed",
  in_transit: "In transit",
  received: "Delivered",
  rejected: "Rejected",
};

export const dynamic = "force-dynamic";

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: { page?: string; stage?: string; farmer?: string; farm?: string; q?: string };
}) {
  const supabase = createClient();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const stage = STAGES.includes(searchParams.stage ?? "") ? searchParams.stage! : "";
  const farmer = searchParams.farmer;
  const farm = searchParams.farm;
  // Strip characters that have meaning inside a PostgREST filter.
  const q = (searchParams.q ?? "").trim().replace(/[%,()*]/g, "").toUpperCase();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("batches")
    .select("id, qr_token, stage, farm_id, farmer_id, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (stage) query = query.eq("stage", stage);
  if (farmer) query = query.eq("farmer_id", farmer);
  if (farm) query = query.eq("farm_id", farm);
  if (q) query = query.ilike("qr_token", `%${q}%`);

  const { data: batches, count } = await query;

  const farmIds = Array.from(new Set((batches ?? []).map((b) => b.farm_id).filter(Boolean)));
  const farmerIds = Array.from(new Set((batches ?? []).map((b) => b.farmer_id).filter(Boolean)));

  const [{ data: farms }, { data: farmers }] = await Promise.all([
    farmIds.length > 0
      ? supabase.from("farms").select("id, name").in("id", farmIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    farmerIds.length > 0
      ? supabase.from("profiles").select("id, name").in("id", farmerIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);
  const farmName = new Map((farms ?? []).map((f) => [f.id, f.name]));
  const farmerName = new Map((farmers ?? []).map((p) => [p.id, p.name]));
  const filteredFarmer = farmer ? farmerName.get(farmer) : null;
  const { data: filteredFarmRow } = farm
    ? await supabase.from("farms").select("name").eq("id", farm).single()
    : { data: null as { name: string } | null };

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function href(over: { page?: number; stage?: string }) {
    const params = new URLSearchParams();
    const s = over.stage !== undefined ? over.stage : stage;
    if (s) params.set("stage", s);
    if (farmer) params.set("farmer", farmer);
    if (farm) params.set("farm", farm);
    if (q) params.set("q", q);
    if (over.page && over.page > 1) params.set("page", String(over.page));
    const qs = params.toString();
    return `/dashboard/batches${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">Batches</h1>
          <p className="text-sm text-muted-foreground">{count ?? 0} batches</p>
        </div>
        {(farmer || farm || stage || q) && (
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/batches">Clear filters{filteredFarmer ? `: ${filteredFarmer}` : filteredFarmRow ? `: ${filteredFarmRow.name}` : ""}</Link>
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant={stage ? "outline" : "default"} size="sm">
          <Link href={href({ stage: "" })}>All</Link>
        </Button>
        {STAGES.map((s) => (
          <Button key={s} asChild variant={stage === s ? "default" : "outline"} size="sm">
            <Link href={href({ stage: s })}>{STAGE_LABEL[s]}</Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>All batches</CardTitle>
            <CardDescription>Click a batch to see its full journey</CardDescription>
          </div>
          <form method="get" className="flex w-full items-center gap-2 sm:w-auto">
            {stage && <input type="hidden" name="stage" value={stage} />}
            {farmer && <input type="hidden" name="farmer" value={farmer} />}
            {farm && <input type="hidden" name="farm" value={farm} />}
            <input
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="Search code, e.g. CLM-0001"
              className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm sm:w-56 sm:flex-none"
            />
            <Button type="submit" size="sm">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-1">
          {(batches ?? []).map((b) => (
            <Link
              key={b.id}
              href={`/dashboard/batches/${b.id}`}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-accent/60"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-sm font-medium text-foreground">{b.qr_token ?? b.id}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {farmName.get(b.farm_id) ?? "Unknown farm"} &middot; {farmerName.get(b.farmer_id) ?? "Unknown farmer"}{" "}
                  &middot; {new Date(b.created_at).toLocaleDateString()}
                </div>
              </div>
              <StageBadge stage={b.stage} />
            </Link>
          ))}
          {!batches?.length && (
            <p className="py-10 text-center text-sm text-muted-foreground">No batches match these filters.</p>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={href({ page: Math.max(1, page - 1) })}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    tabIndex={page <= 1 ? -1 : undefined}
                  >
                    Previous
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={href({ page: Math.min(totalPages, page + 1) })}
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