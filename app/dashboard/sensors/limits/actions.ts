"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/requireAdmin";

const BACK = "/dashboard/sensors/limits";

function num(fd: FormData, key: string): number {
    const s = String(fd.get(key) ?? "").trim();
    return s === "" ? NaN : Number(s);
}

export async function saveLimits(fd: FormData) {
    const { supabase } = await requireAdmin();

    const temperature_min = num(fd, "temperature_min");
    const temperature_max = num(fd, "temperature_max");
    const humidity_min = num(fd, "humidity_min");
    const humidity_max = num(fd, "humidity_max");
    const vibration_max = num(fd, "vibration_max");

    const all = [temperature_min, temperature_max, humidity_min, humidity_max, vibration_max];
    let error = "";
    if (!all.every(Number.isFinite)) error = "Every field must be a number.";
    else if (temperature_min < -20 || temperature_max > 60) error = "Temperature must stay between -20°C and 60°C.";
    else if (temperature_min >= temperature_max) error = "Minimum temperature must be lower than the maximum.";
    else if (humidity_min < 0 || humidity_max > 100) error = "Humidity must stay between 0% and 100%.";
    else if (humidity_min >= humidity_max) error = "Minimum humidity must be lower than the maximum.";
    else if (vibration_max <= 0) error = "Maximum vibration must be greater than 0.";
    if (error) redirect(`${BACK}?error=${encodeURIComponent(error)}`);

    const { data, error: dbError } = await supabase
        .from("sensor_thresholds")
        .update({ temperature_min, temperature_max, humidity_min, humidity_max, vibration_max })
        .eq("id", 1)
        .select("id");
    if (dbError) redirect(`${BACK}?error=${encodeURIComponent(dbError.message)}`);
    if (!data?.length) redirect(`${BACK}?error=${encodeURIComponent("Nothing was updated. Check your permissions.")}`);

    revalidatePath("/dashboard/sensors");
    redirect(`${BACK}?saved=Limits updated`);
}