import Topbar from "@/components/Topbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const [{ data: userData }, { count: alertCount }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("type", "sensor_alert")
      .eq("is_read", false),
  ]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background">
        <Topbar userEmail={userData.user?.email} alertCount={alertCount ?? 0} />
        <main className="mx-auto  px-6 py-8 lg:px-10">{children}</main>
      </div>
    </TooltipProvider>
  );
}
