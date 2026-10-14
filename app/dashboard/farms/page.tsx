import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SubmitButton from "@/components/SubmitButton";
import FarmFields from "./FarmFields";
import { createFarm } from "./actions";

export const dynamic = "force-dynamic";

export default async function FarmsPage() {
    const supabase = createClient();

    const [{ data: farms }, { data: farmers }] = await Promise.all([
        supabase.from("farms").select("id, name, barangay, municipality, owner_id, batches(count)").order("name"),
        supabase.from("profiles").select("id, name").eq("role", "farmer").order("name"),
    ]);
    const farmerName = new Map((farmers ?? []).map((f) => [f.id, f.name]));
    const unlinked = (farms ?? []).filter((f) => !f.owner_id).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-xl font-semibold text-foreground">Farms</h1>
                <p className="text-sm text-muted-foreground">
                    {farms?.length ?? 0} farms{unlinked > 0 ? ` · ${unlinked} without a linked farmer` : ""}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Add a farm</CardTitle>
                    <CardDescription>A farmer can only register harvests for farms linked to them</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={createFarm} className="space-y-4">
                        <FarmFields farmers={farmers ?? []} />
                        <SubmitButton pendingText="Adding…">Add farm</SubmitButton>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>All farms</CardTitle>
                    <CardDescription>Click a farm to edit or delete it</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                    {(farms ?? []).map((f) => (
                        <Link
                            key={f.id}
                            href={`/dashboard/farms/${f.id}`}
                            className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-accent/60"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium text-foreground">{f.name}</div>
                                <div className="truncate text-xs text-muted-foreground">
                                    {f.barangay}, {f.municipality}
                                </div>
                            </div>
                            <Badge variant="outline" className="shrink-0 font-normal">
                                {(f as any).batches?.[0]?.count ?? 0} batches
                            </Badge>
                            {f.owner_id ? (
                                <Badge variant="secondary">{farmerName.get(f.owner_id) ?? "Linked"}</Badge>
                            ) : (
                                <Badge variant="outline" className="text-destructive">
                                    No farmer
                                </Badge>
                            )}
                            <ChevronRight size={14} className="text-muted-foreground" />
                        </Link>
                    ))}
                    {!farms?.length && <p className="py-6 text-center text-sm text-muted-foreground">No farms yet.</p>}
                </CardContent>
            </Card>
        </div>
    );
}