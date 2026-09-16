import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle, Radio, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import StageBadge from "@/components/StageBadge";
import SensorTrendChart from "./SensorTrendChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function BatchDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: batch } = await supabase.from("batches").select("*").eq("id", params.id).single();
  if (!batch) notFound();

  const [{ data: farmer }, { data: readings }, { data: transportRecords }, { data: alerts }] = await Promise.all([
    batch.farmer_id
      ? supabase.from("profiles").select("id, name, email, phone").eq("id", batch.farmer_id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("sensor_readings")
      .select("id, temperature_c, humidity_pct, vibration_g, latitude, longitude, recorded_at")
      .eq("batch_id", batch.id)
      .order("recorded_at", { ascending: false })
      .limit(20),
    supabase
      .from("transport_records")
      .select("id, transporter_id, origin_point, destination_point, departed_at, arrived_at, stopovers")
      .eq("batch_id", batch.id)
      .order("departed_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("id, type, title, message, created_at")
      .eq("batch_id", batch.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const transporterIds = Array.from(new Set((transportRecords ?? []).map((t) => t.transporter_id).filter(Boolean)));
  const { data: transporters } =
    transporterIds.length > 0
      ? await supabase.from("profiles").select("id, name").in("id", transporterIds)
      : { data: [] as { id: string; name: string }[] };
  const transporterName = new Map((transporters ?? []).map((t) => [t.id, t.name]));

  const latestReading = readings?.[0];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
        <Link href="/dashboard/batches">
          <ArrowLeft size={14} />
          Back to batches
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-lg font-medium text-foreground">{batch.qr_token ?? batch.id}</h1>
        <StageBadge stage={batch.stage} />
        <Badge variant="outline" className="text-muted-foreground">
          {batch.sync_status ?? "unknown sync"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Batch info</CardTitle>
            <CardDescription>Farmer, farm, and sync details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Farmer" value={farmer?.name ?? "Unknown"} />
            <InfoRow label="Farmer contact" value={farmer?.phone || farmer?.email || "—"} />
            <InfoRow label="Farm ID" value={<span className="font-mono text-xs">{batch.farm_id ?? "—"}</span>} />
            <InfoRow label="Created" value={new Date(batch.created_at).toLocaleString()} />
            <InfoRow label="Last updated" value={new Date(batch.updated_at).toLocaleString()} />
            {batch.qr_image_url && (
              <div className="pt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={batch.qr_image_url}
                  alt="Batch QR code"
                  className="h-32 w-32 rounded-lg border border-border object-contain"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio size={16} className="text-branding" />
              Latest sensor reading
            </CardTitle>
            <CardDescription>
              {latestReading ? new Date(latestReading.recorded_at).toLocaleString() : "No readings yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latestReading ? (
              <div className="grid grid-cols-3 gap-3 text-center">
                <Metric label="Temp" value={`${latestReading.temperature_c ?? "—"}°C`} />
                <Metric label="Humidity" value={`${latestReading.humidity_pct ?? "—"}%`} />
                <Metric label="Vibration" value={`${latestReading.vibration_g ?? "—"}g`} />
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">No sensor readings yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Temperature trend</CardTitle>
          <CardDescription>Last {readings?.length ?? 0} readings for this batch</CardDescription>
        </CardHeader>
        <CardContent>
          <SensorTrendChart readings={readings ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck size={16} className="text-primary-dark" />
            Transport
          </CardTitle>
          <CardDescription>Delivery legs recorded for this batch</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(transportRecords ?? []).map((tr) => {
            const stopoverCount = Array.isArray(tr.stopovers) ? tr.stopovers.length : 0;
            return (
              <div key={tr.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium text-foreground">
                    {tr.origin_point} → {tr.destination_point}
                  </div>
                  <Badge variant={tr.arrived_at ? "secondary" : "default"}>
                    {tr.arrived_at ? "Completed" : "In transit"}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Transporter: {transporterName.get(tr.transporter_id) ?? "Unknown"} &middot; Departed{" "}
                  {tr.departed_at ? new Date(tr.departed_at).toLocaleString() : "—"}
                  {tr.arrived_at && ` · Arrived ${new Date(tr.arrived_at).toLocaleString()}`}
                  {stopoverCount > 0 && ` · ${stopoverCount} stopover${stopoverCount === 1 ? "" : "s"}`}
                </div>
              </div>
            );
          })}
          {!transportRecords?.length && (
            <p className="py-6 text-center text-sm text-muted-foreground">No transport records for this batch yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert &amp; notification history</CardTitle>
          <CardDescription>Everything logged against this batch</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {(alerts ?? []).map((n) => (
            <div key={n.id} className="flex items-start gap-3 rounded-xl px-2 py-2.5">
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  n.type === "sensor_alert" ? "bg-destructive/15 text-destructive" : "bg-secondary text-secondary-foreground"
                }`}
              >
                <AlertTriangle size={14} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">{n.title}</div>
                <div className="text-xs text-muted-foreground">{n.message}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
          {!alerts?.length && (
            <p className="py-6 text-center text-sm text-muted-foreground">No notifications for this batch yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary py-3">
      <div className="font-mono text-lg text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
