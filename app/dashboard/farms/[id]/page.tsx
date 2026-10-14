import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StageBadge from "@/components/StageBadge";
import SubmitButton from "@/components/SubmitButton";
import ConfirmDelete from "@/components/ConfirmDelete";
import FarmFields from "../FarmFields";
import { updateFarm, deleteFarm } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditFarmPage({
    params,
}: {
    params: { id: string };
}) {
    const supabase = createClient();

    const [{ data: farm }, { data: farmers }] = await Promise.all([
        supabase.from("farms").select("*").eq("id", params.id).single(),
        supabase.from("profiles").select("id, name").eq("role", "farmer").order("name"),
    ]);
    if (!farm) notFound();

    const [{ data: stageRows }, { data: recent }, { data: harvests }] = await Promise.all([
        supabase.from("batches").select("stage").eq("farm_id", farm.id),
        supabase
            .from("batches")
            .select("id, qr_token, stage, created_at, farmer_id")
            .eq("farm_id", farm.id)
            .order("created_at", { ascending: false })
            .limit(10),
        supabase.from("harvest_records").select("batch_id, initial_volume_kg").eq("farm_id", farm.id),
    ]);

    const totalBatches = stageRows?.length ?? 0;
    const inProgress = (stageRows ?? []).filter((b) => b.stage !== "received" && b.stage !== "rejected").length;
    const delivered = (stageRows ?? []).filter((b) => b.stage === "received").length;
    const totalKg = (harvests ?? []).reduce((sum, h) => sum + Number(h.initial_volume_kg ?? 0), 0);
    const volumeByBatch = new Map((harvests ?? []).map((h) => [h.batch_id, h.initial_volume_kg]));
    const owner = (farmers ?? []).find((f) => f.id === farm.owner_id);
    const harvesterIds = Array.from(new Set((recent ?? []).map((b) => b.farmer_id).filter(Boolean)));
    const { data: harvesters } = harvesterIds.length
        ? await supabase.from("profiles").select("id, name").in("id", harvesterIds as string[])
        : { data: [] as { id: string; name: string }[] };
    const harvesterName = new Map((harvesters ?? []).map((h) => [h.id, h.name]));

    return (
        <div className="space-y-6">
            <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
                <Link href="/dashboard/farms">
                    <ArrowLeft size={14} />
                    Back to farms
                </Link>
            </Button>

            <div>
                <h1 className="font-heading text-xl font-semibold text-foreground">{farm.name}</h1>
                <p className="text-sm text-muted-foreground">
                    {farm.barangay}, {farm.municipality} &middot; {owner ? `Farmer: ${owner.name}` : "No farmer linked"}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Stat label="Total batches" value={totalBatches} />
                <Stat label="In progress" value={inProgress} />
                <Stat label="Delivered" value={delivered} />
                <Stat label="Total harvested" value={`${Number(totalKg.toFixed(1))} kg`} />
            </div>

            <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle>Batches from this farm</CardTitle>
                        <CardDescription>Most recent 10 &middot; click one to see its full journey</CardDescription>
                    </div>
                    {totalBatches > 10 && (
                        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                            <Link href={`/dashboard/batches?farm=${farm.id}`}>View all {totalBatches}</Link>
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-1">
                    {(recent ?? []).map((b) => (
                        <Link
                            key={b.id}
                            href={`/dashboard/batches/${b.id}`}
                            className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-accent/60"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="truncate font-mono text-sm font-medium text-foreground">{b.qr_token ?? b.id}</div>
                                <div className="truncate text-xs text-muted-foreground">
                                    {new Date(b.created_at).toLocaleDateString()}
                                    {volumeByBatch.has(b.id) ? ` · ${volumeByBatch.get(b.id)} kg harvested` : ""}
                                    {b.farmer_id && harvesterName.get(b.farmer_id) ? ` · by ${harvesterName.get(b.farmer_id)}` : ""}
                                </div>
                            </div>
                            <StageBadge stage={b.stage} />
                        </Link>
                    ))}
                    {!recent?.length && (
                        <p className="py-6 text-center text-sm text-muted-foreground">No batches from this farm yet.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Farm details</CardTitle>
                    <CardDescription>Changing the linked farmer applies right away. Existing batches stay recorded under the farmer who harvested them.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={updateFarm} className="space-y-4">
                        <input type="hidden" name="id" value={farm.id} />
                        <FarmFields farmers={farmers ?? []} defaults={farm} />
                        <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-destructive">Delete farm</CardTitle>
                    <CardDescription>A farm that already has batches can&apos;t be deleted</CardDescription>
                </CardHeader>
                <CardContent>
                    {totalBatches > 0 ? (
                        <p className="text-sm text-muted-foreground">
                            This farm has {totalBatches} {totalBatches === 1 ? "batch" : "batches"}, so it can&apos;t be deleted.
                            Unlink the farmer above if the farm is no longer in use.
                        </p>
                    ) : (
                        <form action={deleteFarm}>
                            <input type="hidden" name="id" value={farm.id} />
                            <ConfirmDelete
                                title={`Delete ${farm.name}?`}
                                description="This permanently removes the farm. This can't be undone."
                                triggerLabel="Delete this farm…"
                                confirmLabel="Yes, delete"
                            />
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <Card>
            <CardContent className="space-y-1 p-4">
                <div className="text-xs font-medium text-muted-foreground">{label}</div>
                <div className="text-2xl font-semibold text-foreground">{value}</div>
            </CardContent>
        </Card>
    );
}