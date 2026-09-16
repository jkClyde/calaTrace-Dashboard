import Link from "next/link";
import { Package, Radio, Truck, AlertTriangle, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import StageChart from "@/components/StageChart";
import AlertsChart from "@/components/AlertsChart";
import InitialsAvatar from "@/components/InitialsAvatar";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const [
    { data: stageData },
    { data: dailyAlerts },
    { data: weeklyAlerts },
    { data: monthlyAlerts },
    { data: transitData },
    { data: farmerData },
    { data: transporterData },
    { data: recentAlerts },
  ] = await Promise.all([
    supabase.from("admin_batches_by_stage").select("*"),
    supabase.from("admin_sensor_alerts_by_day").select("*").order("bucket", { ascending: true }),
    supabase.from("admin_sensor_alerts_by_week").select("*").order("bucket", { ascending: true }),
    supabase.from("admin_sensor_alerts_by_month").select("*").order("bucket", { ascending: true }),
    supabase.from("admin_transit_times").select("*").order("departed_at", { ascending: false }).limit(5),
    supabase.from("admin_farmer_activity").select("*").order("batch_count", { ascending: false }),
    supabase.from("admin_transporter_activity").select("*").order("delivery_count", { ascending: false }),
    supabase
      .from("notifications")
      .select("id, batch_id, title, message, created_at")
      .eq("type", "sensor_alert")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalBatches = (stageData ?? []).reduce((sum, row) => sum + row.batch_count, 0);
  const totalAlerts = (dailyAlerts ?? []).reduce((sum, row) => sum + row.alert_count, 0);
  const avgTransit =
    transitData && transitData.length
      ? transitData.reduce((sum, row) => sum + (row.transit_hours ?? 0), 0) / transitData.length
      : null;

  const team = [
    ...(farmerData ?? []).map((r) => ({ id: r.farmer_id, name: r.name, count: r.batch_count, role: "Farmer" })),
    ...(transporterData ?? []).map((r) => ({
      id: r.transporter_id,
      name: r.name,
      count: r.delivery_count,
      role: "Transporter",
    })),
  ]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
      {/* Main column */}
      <div className="min-w-0 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={Package}
            iconClass="bg-branding/15 text-branding"
            label="Total batches"
            value={totalBatches}
            href="/dashboard/batches"
          />
          <StatCard
            icon={Radio}
            iconClass="bg-destructive/10 text-destructive"
            label="Sensor alerts"
            value={totalAlerts}
            href="/dashboard/sensors"
          />
          <StatCard
            icon={Truck}
            iconClass="bg-primary-dark/15 text-primary-dark"
            label="Avg. transit"
            value={avgTransit !== null ? `${avgTransit.toFixed(1)}h` : "—"}
            href="/dashboard/transport"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sensor alerts</CardTitle>
            <CardDescription>Danger-range readings logged over time</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertsChart daily={dailyAlerts ?? []} weekly={weeklyAlerts ?? []} monthly={monthlyAlerts ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Batches by stage</CardTitle>
              <CardDescription>Where every batch currently sits in the chain of custody</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              <Link href="/dashboard/batches">
                View all <ChevronRight size={14} />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <StageChart data={stageData ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent deliveries</CardTitle>
              <CardDescription>Most recent completed transport records</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              <Link href="/dashboard/transport">
                View all <ChevronRight size={14} />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {(transitData ?? []).map((row) => (
              <Link
                key={row.id}
                href={`/dashboard/batches/${row.batch_id}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-accent/60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <Truck size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {row.origin_point} → {row.destination_point}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="font-mono">{row.batch_id?.slice(0, 8)}</span>
                    <span>&middot;</span>
                    <span>{new Date(row.departed_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0 font-mono">
                  {row.transit_hours?.toFixed(1)}h
                </Badge>
              </Link>
            ))}
            {!transitData?.length && (
              <p className="py-6 text-center text-sm text-muted-foreground">No completed deliveries yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Recent alerts</CardTitle>
              <CardDescription>Latest danger-range notifications</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/dashboard/sensors">All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {(recentAlerts ?? []).map((n) => (
              <Link
                key={n.id}
                href={n.batch_id ? `/dashboard/batches/${n.batch_id}` : "/dashboard/sensors"}
                className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition hover:bg-accent/60"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                  <AlertTriangle size={14} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{n.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{n.message}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              </Link>
            ))}
            {!recentAlerts?.length && (
              <p className="py-6 text-center text-sm text-muted-foreground">No alerts logged yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Team activity</CardTitle>
              <CardDescription>Top farmers &amp; transporters</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/dashboard/people">All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {team.map((person) => (
              <div
                key={`${person.role}-${person.id}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-accent/60"
              >
                <InitialsAvatar name={person.name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{person.name}</div>
                  <div className="text-xs text-muted-foreground">{person.role}</div>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {person.count}
                </Badge>
              </div>
            ))}
            {!team.length && <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
