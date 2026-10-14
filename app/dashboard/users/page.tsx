import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { changeRole } from "./action";

const PAGE_SIZE = 25;
const ROLES = ["farmer", "intermediary", "transporter", "retailer", "admin", "consumer"];

export const dynamic = "force-dynamic";

export default async function UsersPage({
    searchParams,
}: {
    searchParams: { page?: string; role?: string; q?: string; error?: string; saved?: string };
}) {
    const supabase = createClient();
    const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
    const role = ROLES.includes(searchParams.role ?? "") ? searchParams.role! : "";
    const q = (searchParams.q ?? "").trim().replace(/[,()*]/g, "");
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
        .from("profiles")
        .select("id, name, email, phone, role, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);
    if (role) query = query.eq("role", role);
    if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);

    const [{ data: users, count }, { data: allRoles }, { data: userData }] = await Promise.all([
        query,
        supabase.from("profiles").select("role"),
        supabase.auth.getUser(),
    ]);
    const me = userData.user?.id;

    const roleCounts: Record<string, number> = {};
    (allRoles ?? []).forEach((r) => (roleCounts[r.role] = (roleCounts[r.role] ?? 0) + 1));

    const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

    function href(over: { page?: number; role?: string }) {
        const params = new URLSearchParams();
        const r = over.role !== undefined ? over.role : role;
        if (r) params.set("role", r);
        if (q) params.set("q", q);
        if (over.page && over.page > 1) params.set("page", String(over.page));
        const qs = params.toString();
        return `/dashboard/users${qs ? `?${qs}` : ""}`;
    }
    const here = href({ page });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-xl font-semibold text-foreground">Users</h1>
                <p className="text-sm text-muted-foreground">{count ?? 0} users &middot; manage who can do what</p>
            </div>

            {searchParams.error && (
                <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{searchParams.error}</p>
            )}
            {searchParams.saved && (
                <p className="rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">{searchParams.saved}</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant={role ? "outline" : "default"} size="sm">
                    <Link href={href({ role: "" })}>All</Link>
                </Button>
                {ROLES.map((r) => (
                    <Button key={r} asChild variant={role === r ? "default" : "outline"} size="sm">
                        <Link href={href({ role: r })} className="capitalize">
                            {r} · {roleCounts[r] ?? 0}
                        </Link>
                    </Button>
                ))}
            </div>

            <Card>
                <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
                    <div>
                        <CardTitle>All users</CardTitle>
                        <CardDescription>Making someone an admin gives them full access to this dashboard</CardDescription>
                    </div>
                    <form method="get" className="flex items-center gap-2">
                        {role && <input type="hidden" name="role" value={role} />}
                        <input
                            name="q"
                            defaultValue={searchParams.q ?? ""}
                            placeholder="Search name or email"
                            className="h-9 w-56 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <Button type="submit" size="sm">
                            Search
                        </Button>
                    </form>
                </CardHeader>
                <CardContent className="space-y-1">
                    {(users ?? []).map((u) => (
                        <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-xl px-2 py-2.5">
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium text-foreground">{u.name ?? "Unnamed"}</div>
                                <div className="truncate text-xs text-muted-foreground">
                                    {u.email ?? "no email"}
                                    {u.phone ? ` · ${u.phone}` : ""}
                                </div>
                            </div>
                            {u.id === me ? (
                                <span className="text-xs text-muted-foreground">You &middot; {u.role}</span>
                            ) : (
                                <form action={changeRole} className="flex items-center gap-2">
                                    <input type="hidden" name="target" value={u.id} />
                                    <input type="hidden" name="returnTo" value={here} />
                                    <select
                                        name="role"
                                        defaultValue={u.role}
                                        className="h-9 rounded-md border border-input bg-background px-2 text-sm capitalize"
                                    >
                                        {ROLES.map((r) => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                    <Button type="submit" size="sm" variant="outline">
                                        Save
                                    </Button>
                                </form>
                            )}
                        </div>
                    ))}
                    {!users?.length && <p className="py-10 text-center text-sm text-muted-foreground">No users match.</p>}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-border pt-4">
                            <p className="text-xs text-muted-foreground">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button asChild variant="outline" size="sm">
                                    <Link
                                        href={href({ page: Math.max(1, page - 1) })}
                                        className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                                        tabIndex={page <= 1 ? -1 : undefined}
                                    >
                                        Previous
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="sm">
                                    <Link
                                        href={href({ page: Math.min(totalPages, page + 1) })}
                                        className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                                        tabIndex={page >= totalPages ? -1 : undefined}
                                    >
                                        Next
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}