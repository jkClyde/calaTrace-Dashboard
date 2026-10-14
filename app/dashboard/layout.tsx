import { Suspense } from "react";
import Link from "next/link";
import { UserCheck } from "lucide-react";
import Topbar from "@/components/Topbar";
import FlashToast from "@/components/FlashToast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const [{ data: userData }, { count: alertCount }, { count: pendingCount }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("type", "sensor_alert")
      .eq("is_read", false),
    // Accounts waiting for approval (needs migration_user_approval.sql; hidden until then).
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background">
        <Topbar userEmail={userData.user?.email} alertCount={alertCount ?? 0} />
        {!!pendingCount && pendingCount > 0 && (
          <Link
            href="/dashboard/people"
            className="flex items-center justify-center gap-2 bg-amber-500/15 px-6 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-500/25 dark:text-amber-300"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            <UserCheck size={15} />
            {pendingCount} {pendingCount === 1 ? "account is" : "accounts are"} waiting for your approval
            <span className="underline">Review</span>
          </Link>
        )}
        <Suspense fallback={null}>
          <FlashToast />
        </Suspense>
        <main className="mx-auto  px-6 py-8 lg:px-10">{children}</main>
      </div>
    </TooltipProvider>
  );
}