import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Farmer = { id: string; name: string | null };
type Defaults = {
    name?: string;
    barangay?: string;
    municipality?: string;
    latitude?: number;
    longitude?: number;
    owner_id?: string | null;
};

export default function FarmFields({ farmers, defaults = {} }: { farmers: Farmer[]; defaults?: Defaults }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
                <Label htmlFor="name">Farm name</Label>
                <Input id="name" name="name" defaultValue={defaults.name} required />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="owner_id">Linked farmer</Label>
                <select
                    id="owner_id"
                    name="owner_id"
                    defaultValue={defaults.owner_id ?? ""}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                    <option value="">Not linked yet</option>
                    {farmers.map((f) => (
                        <option key={f.id} value={f.id}>
                            {f.name ?? f.id}
                        </option>
                    ))}
                </select>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="barangay">Barangay</Label>
                <Input id="barangay" name="barangay" defaultValue={defaults.barangay} required />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="municipality">Municipality</Label>
                <Input id="municipality" name="municipality" defaultValue={defaults.municipality} required />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" name="latitude" type="number" step="any" defaultValue={defaults.latitude} required />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" name="longitude" type="number" step="any" defaultValue={defaults.longitude} required />
            </div>
        </div>
    );
}