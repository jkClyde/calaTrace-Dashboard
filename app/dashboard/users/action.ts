"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/requireAdmin";

const ROLES = ["farmer", "intermediary", "transporter", "retailer", "admin", "consumer"];

function back(returnTo: string, key: "error" | "saved", msg: string): never {
    const base = returnTo.startsWith("/dashboard/users") ? returnTo : "/dashboard/users";
    const u = new URL(base, "http://local");
    u.searchParams.delete("error");
    u.searchParams.delete("saved");
    u.searchParams.set(key, msg);
    redirect(u.pathname + u.search);
}

export async function changeRole(fd: FormData) {
    const { supabase } = await requireAdmin();
    const target = String(fd.get("target") ?? "");
    const role = String(fd.get("role") ?? "");
    const returnTo = String(fd.get("returnTo") ?? "/dashboard/users");

    if (!target || !ROLES.includes(role)) back(returnTo, "error", "Choose a valid role.");

    const { error } = await supabase.rpc("admin_set_role", { target_user: target, new_role: role });
    if (error) {
        const friendly: Record<string, string> = {
            "not authorized": "You are not allowed to change roles.",
            "invalid role": "That role isn't valid.",
            "admins cannot demote themselves": "You can't change your own admin role.",
            "user not found": "That user no longer exists.",
        };
        back(returnTo, "error", friendly[error.message] ?? error.message);
    }

    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/people");
    back(returnTo, "saved", "Role updated");
}