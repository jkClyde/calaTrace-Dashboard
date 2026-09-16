import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import InitialsAvatar from "@/components/InitialsAvatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const supabase = createClient();

  const [
    { data: farmers },
    { data: transporters },
    { data: intermediaries },
    { data: retailers },
    { data: admins },
    { data: consumers },
  ] = await Promise.all([
    supabase.from("admin_farmer_activity").select("*").order("batch_count", { ascending: false }),
    supabase.from("admin_transporter_activity").select("*").order("delivery_count", { ascending: false }),
    // No dedicated view yet for these roles — pull directly from profiles + related records.
    supabase
      .from("profiles")
      .select("id, name, consolidation_records(count)")
      .eq("role", "intermediary"),
    supabase
      .from("profiles")
      .select("id, name, retail_records(count)")
      .eq("role", "retailer"),
    supabase.from("profiles").select("id, name, email, created_at").eq("role", "admin"),
    supabase.from("profiles").select("id, name, email, created_at").eq("role", "consumer"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">People</h1>
        <p className="text-sm text-muted-foreground">Everyone across the supply chain</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Farmers</CardTitle>
            <CardDescription>Click a farmer to see their batches</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {(farmers ?? []).map((f) => (
              <Link
                key={f.farmer_id}
                href={`/dashboard/batches?farmer=${f.farmer_id}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-accent/60"
              >
                <InitialsAvatar name={f.name} />
                <div className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{f.name}</div>
                <Badge variant="secondary">{f.batch_count} batches</Badge>
              </Link>
            ))}
            {!farmers?.length && <p className="py-6 text-center text-sm text-muted-foreground">No farmers yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transporters</CardTitle>
            <CardDescription>Click a transporter to see their deliveries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {(transporters ?? []).map((t) => (
              <Link
                key={t.transporter_id}
                href={`/dashboard/transport?transporter=${t.transporter_id}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-accent/60"
              >
                <InitialsAvatar name={t.name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Avg. {t.avg_transit_hours ? t.avg_transit_hours.toFixed(1) : "—"}h transit
                  </div>
                </div>
                <Badge variant="secondary">{t.delivery_count} deliveries</Badge>
              </Link>
            ))}
            {!transporters?.length && (
              <p className="py-6 text-center text-sm text-muted-foreground">No transporters yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Intermediaries</CardTitle>
            <CardDescription>Consolidation activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {(intermediaries ?? []).map((i: any) => (
              <div key={i.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                <InitialsAvatar name={i.name} />
                <div className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {i.name ?? "Unnamed"}
                </div>
                <Badge variant="secondary">
                  {i.consolidation_records?.[0]?.count ?? 0} consolidations
                </Badge>
              </div>
            ))}
            {!intermediaries?.length && (
              <p className="py-6 text-center text-sm text-muted-foreground">No intermediaries yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retailers</CardTitle>
            <CardDescription>Receiving activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {(retailers ?? []).map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                <InitialsAvatar name={r.name} />
                <div className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {r.name ?? "Unnamed"}
                </div>
                <Badge variant="secondary">{r.retail_records?.[0]?.count ?? 0} receipts</Badge>
              </div>
            ))}
            {!retailers?.length && (
              <p className="py-6 text-center text-sm text-muted-foreground">No retailers yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admins</CardTitle>
            <CardDescription>Dashboard administrators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {(admins ?? []).map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                <InitialsAvatar name={a.name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{a.name ?? "Unnamed"}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.email ?? "—"}</div>
                </div>
              </div>
            ))}
            {!admins?.length && <p className="py-6 text-center text-sm text-muted-foreground">No admins yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consumers</CardTitle>
            <CardDescription>End users of the traceability app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {(consumers ?? []).map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                <InitialsAvatar name={c.name} />
                <div className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {c.name ?? "Unnamed user"}
                </div>
              </div>
            ))}
            {!consumers?.length && (
              <p className="py-6 text-center text-sm text-muted-foreground">No consumers yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}