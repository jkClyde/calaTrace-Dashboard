"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/requireAdmin";

type FarmInput = {
  name: string;
  barangay: string;
  municipality: string;
  latitude: number;
  longitude: number;
  owner_id: string | null;
};

function num(raw: FormDataEntryValue | null): number {
  const s = String(raw ?? "").trim();
  return s === "" ? NaN : Number(s);
}

function parseFarm(fd: FormData): { value?: FarmInput; error?: string } {
  const name = String(fd.get("name") ?? "").trim();
  const barangay = String(fd.get("barangay") ?? "").trim();
  const municipality = String(fd.get("municipality") ?? "").trim();
  const latitude = num(fd.get("latitude"));
  const longitude = num(fd.get("longitude"));
  const owner = String(fd.get("owner_id") ?? "").trim();

  if (!name || !barangay || !municipality) return { error: "Name, barangay and municipality are required." };
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)
    return { error: "Latitude must be a number between -90 and 90." };
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
    return { error: "Longitude must be a number between -180 and 180." };

  return { value: { name, barangay, municipality, latitude, longitude, owner_id: owner || null } };
}

export async function createFarm(fd: FormData) {
  const { supabase } = await requireAdmin();
  const { value, error } = parseFarm(fd);
  if (error || !value) redirect(`/dashboard/farms?error=${encodeURIComponent(error ?? "Invalid farm")}`);

  if (value.owner_id) {
    const { data: owner } = await supabase.from("profiles").select("role").eq("id", value.owner_id).single();
    if (owner?.role !== "farmer")
      redirect(`/dashboard/farms?error=${encodeURIComponent("The linked person must have the farmer role.")}`);
  }

  // Same name + same barangay + municipality = almost certainly a double click or a repeat.
  const { data: dupes } = await supabase
    .from("farms")
    .select("id")
    .ilike("name", value.name)
    .ilike("barangay", value.barangay)
    .ilike("municipality", value.municipality)
    .limit(1);
  if (dupes?.length)
    redirect(
      `/dashboard/farms?error=${encodeURIComponent(
        `A farm named "${value.name}" already exists in ${value.barangay}, ${value.municipality}.`
      )}`
    );

  const { data: created, error: dbError } = await supabase.from("farms").insert(value).select("id").single();
  if (dbError || !created) redirect(`/dashboard/farms?error=${encodeURIComponent(dbError?.message ?? "Could not add the farm.")}`);

  revalidatePath("/dashboard/farms");
  redirect(`/dashboard/farms/${created.id}?saved=Farm added`);
}

export async function updateFarm(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const back = `/dashboard/farms/${id}`;
  const { value, error } = parseFarm(fd);
  if (error || !value) redirect(`${back}?error=${encodeURIComponent(error ?? "Invalid farm")}`);

  if (value.owner_id) {
    const { data: owner } = await supabase.from("profiles").select("role").eq("id", value.owner_id).single();
    if (owner?.role !== "farmer")
      redirect(`${back}?error=${encodeURIComponent("The linked person must have the farmer role.")}`);
  }

  const { data, error: dbError } = await supabase.from("farms").update(value).eq("id", id).select("id");
  if (dbError) redirect(`${back}?error=${encodeURIComponent(dbError.message)}`);
  if (!data?.length) redirect(`${back}?error=${encodeURIComponent("Nothing was updated. Check your permissions.")}`);

  revalidatePath("/dashboard/farms");
  redirect(`${back}?saved=Farm updated`);
}

export async function deleteFarm(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const back = `/dashboard/farms/${id}`;

  const { data, error } = await supabase.from("farms").delete().eq("id", id).select("id");
  if (error) {
    const msg =
      error.code === "23503"
        ? "This farm has batches linked to it, so it can't be deleted."
        : error.message;
    redirect(`${back}?error=${encodeURIComponent(msg)}`);
  }
  if (!data?.length) redirect(`${back}?error=${encodeURIComponent("Nothing was deleted. Check your permissions.")}`);

  revalidatePath("/dashboard/farms");
  redirect("/dashboard/farms?saved=Farm deleted");
}