import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLimits } from "./actions";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function SensorLimitsPage() {
    const supabase = createClient();
    const { data: t } = await supabase.from("sensor_thresholds").select("*").eq("id", 1).single();

    return (
        <div className="space-y-6">
            <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
                <Link href="/dashboard/sensors">
                    <ArrowLeft size={14} />
                    Back to sensors
                </Link>
            </Button>

            <div>
                <h1 className="font-heading text-xl font-semibold text-foreground">Sensor limits</h1>
                <p className="text-sm text-muted-foreground">The safe ranges used by the mobile app and the alerts</p>
            </div>

            {!t ? (
                <p className="text-sm text-destructive">Couldn&apos;t load the current limits.</p>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Safe ranges</CardTitle>
                        <CardDescription>
                            A reading outside these ranges is shown as a warning or danger. Changes apply to every device straight away.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={saveLimits} className="space-y-5">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="temperature_min">Minimum temperature (°C)</Label>
                                    <Input id="temperature_min" name="temperature_min" type="number" step="any" defaultValue={t.temperature_min} required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="temperature_max">Maximum temperature (°C)</Label>
                                    <Input id="temperature_max" name="temperature_max" type="number" step="any" defaultValue={t.temperature_max} required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="humidity_min">Minimum humidity (%)</Label>
                                    <Input id="humidity_min" name="humidity_min" type="number" step="any" defaultValue={t.humidity_min} required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="humidity_max">Maximum humidity (%)</Label>
                                    <Input id="humidity_max" name="humidity_max" type="number" step="any" defaultValue={t.humidity_max} required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="vibration_max">Maximum vibration (g)</Label>
                                    <Input id="vibration_max" name="vibration_max" type="number" step="any" defaultValue={t.vibration_max} required />
                                </div>
                            </div>
                            <SubmitButton pendingText="Saving…">Save limits</SubmitButton>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}