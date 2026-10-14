import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Used by server actions. Middleware already guards the pages; this keeps the
// write paths safe on their own too.
export async function requireAdmin() {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (me?.role !== "admin") redirect("/login?error=not-admin");

    return { supabase, user };
}