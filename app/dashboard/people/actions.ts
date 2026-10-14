"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/requireAdmin";

const ROLES = ["farmer", "intermediary", "transporter", "retailer", "admin", "consumer"];

function back(key: "error" | "saved", msg: string): never {
    redirect(`/dashboard/people?${key}=${encodeURIComponent(msg)}`);
}

export async function changeRole(fd: FormData) {
    const { supabase } = await requireAdmin();
    const target = String(fd.get("target") ?? "");
    const role = String(fd.get("role") ?? "");

    if (!target || !ROLES.includes(role)) back("error", "Choose a valid role.");

    const { error } = await supabase.rpc("admin_set_role", { target_user: target, new_role: role });
    if (error) {
        const friendly: Record<string, string> = {
            "not authorized": "You are not allowed to change roles.",
            "invalid role": "That role isn't valid.",
            "admins cannot demote themselves": "You can't change your own admin role.",
            "user not found": "That user no longer exists.",
        };
        back("error", friendly[error.message] ?? error.message);
    }

    revalidatePath("/dashboard/people");
    back("saved", "Role updated");
}

export async function setUserStatus(fd: FormData) {
    const { supabase } = await requireAdmin();
    const target = String(fd.get("target") ?? "");
    const status = String(fd.get("status") ?? "");

    if (!target || !["approved", "rejected", "pending"].includes(status)) back("error", "Invalid request.");

    const { data: person } = await supabase.from("profiles").select("name").eq("id", target).single();

    const { error } = await supabase.rpc("admin_set_status", { target_user: target, new_status: status });
    if (error) {
        const friendly: Record<string, string> = {
            "not authorized": "You are not allowed to approve or reject accounts.",
            "invalid status": "That status isn't valid.",
            "admins cannot change their own status": "You can't change your own status.",
            "user not found": "That user no longer exists.",
        };
        back(
            "error",
            friendly[error.message] ??
            (error.message.includes("admin_set_status")
                ? "Approval isn't set up in the database yet. Run migration_user_approval.sql first."
                : error.message)
        );
    }

    revalidatePath("/dashboard/people");
    const who = person?.name ?? "The user";
    back("saved", status === "approved" ? `${who} approved` : status === "rejected" ? `${who} rejected` : `${who} set to pending`);
}