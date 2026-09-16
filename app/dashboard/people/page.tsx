import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import InitialsAvatar from "@/components/InitialsAvatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const supabase = createClient();

  const [{ data: farmers }, { data: transporters }] = await Promise.all([
    supabase.from("admin_farmer_activity").select("*").order("batch_count", { ascending: false }),
    supabase.from("admin_transporter_activity").select("*").order("delivery_count", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">People</h1>
        <p className="text-sm text-muted-foreground">Farmers and transporters across the supply chain</p>
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
      </div>
    </div>
  );
}
