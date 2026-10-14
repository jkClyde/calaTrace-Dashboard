import SubmitButton from "@/components/SubmitButton";
import { changeRole } from "./actions";

const ROLES = ["farmer", "intermediary", "transporter", "retailer", "admin", "consumer"];

// Small "change role" control shown on each person's row.
// Your own row shows a label instead, so you can't remove your own admin role.
export default function RoleControl({ id, role, me }: { id: string; role: string; me?: string }) {
    if (id === me) return <span className="shrink-0 text-xs text-muted-foreground">You</span>;

    return (
        <form action={changeRole} className="flex shrink-0 items-center gap-1.5">
            <input type="hidden" name="target" value={id} />
            <select
                name="role"
                defaultValue={role}
                aria-label="Role"
                className="h-8 rounded-md border border-input bg-background px-2 text-xs capitalize"
            >
                {ROLES.map((r) => (
                    <option key={r} value={r}>
                        {r}
                    </option>
                ))}
            </select>
            <SubmitButton size="sm" variant="outline" pendingText="Saving" className="h-8 px-2 text-xs">
                Save
            </SubmitButton>
        </form>
    );
}