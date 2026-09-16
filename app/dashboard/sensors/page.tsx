import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AlertsChart from "@/components/AlertsChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

export const dynamic = "force-dynamic";

export default async function SensorsPage({ searchParams }: { searchParams: { page?: string } }) {
  const supabase = createClient();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [{ data: dailyAlerts }, { data: weeklyAlerts }, { data: monthlyAlerts }, { data: alerts, count }] =
    await Promise.all([
      supabase.from("admin_sensor_alerts_by_day").select("*").order("bucket", { ascending: true }),
      supabase.from("admin_sensor_alerts_by_week").select("*").order("bucket", { ascending: true }),
      supabase.from("admin_sensor_alerts_by_month").select("*").order("bucket", { ascending: true }),
      supabase
        .from("notifications")
        .select("id, batch_id, title, message, created_at", { count: "exact" })
        .eq("type", "sensor_alert")
        .order("created_at", { ascending: false })
        .range(from, to),
    ]);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function pageHref(p: number) {
    return `/dashboard/sensors${p > 1 ? `?page=${p}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">Sensors</h1>
        <p className="text-sm text-muted-foreground">{count ?? 0} alerts logged</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alert trend</CardTitle>
          <CardDescription>Danger-range readings logged over time</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertsChart daily={dailyAlerts ?? []} weekly={weeklyAlerts ?? []} monthly={monthlyAlerts ?? []} height={300} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All alerts</CardTitle>
          <CardDescription>Click an alert to view its batch</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {(alerts ?? []).map((n) => (
            <Link
              key={n.id}
              href={n.batch_id ? `/dashboard/batches/${n.batch_id}` : "#"}
              className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition hover:bg-accent/60"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <AlertTriangle size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">{n.title}</div>
                <div className="text-xs text-muted-foreground">{n.message}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            </Link>
          ))}
          {!alerts?.length && <p className="py-10 text-center text-sm text-muted-foreground">No alerts logged yet.</p>}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
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
