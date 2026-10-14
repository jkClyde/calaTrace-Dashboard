"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, Leaf, Loader2, LogOut, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ThemeToggle from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initialsFrom } from "@/lib/initials";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/batches", label: "Batches" },
  { href: "/dashboard/farms", label: "Farms" },
  { href: "/dashboard/sensors", label: "Sensors" },
  { href: "/dashboard/transport", label: "Transport" },
  { href: "/dashboard/people", label: "People" },
  { href: "/dashboard/users", label: "Users" },
];

export default function Topbar({
  userEmail,
  alertCount,
}: {
  userEmail?: string | null;
  alertCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/dashboard/batches?q=${encodeURIComponent(q)}` : "/dashboard/batches");
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {signingOut && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Signing out…</p>
        </div>
      )}
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur sm:px-6 lg:gap-x-4 lg:px-10 lg:py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Leaf size={17} strokeWidth={2.25} />
          </div>
          <span className="hidden font-logo text-lg text-foreground sm:inline">CalaTrace</span>
        </Link>

        <nav className="order-last flex w-full items-center gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:order-none lg:w-auto lg:pb-0 [&::-webkit-scrollbar]:hidden">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search batches by QR token..."
              className="h-9 w-56 rounded-full pl-9 text-xs"
            />
          </form>

          <Link href="/dashboard/sensors" aria-label="Sensor alerts" className="relative">
            <Button variant="outline" size="icon" className="rounded-full">
              <Bell size={16} />
            </Button>
            {!!alertCount && alertCount > 0 && (
              <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold text-destructive-foreground">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </Link>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex h-auto items-center gap-2 rounded-full px-2 py-1">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/15 text-primary">
                    {initialsFrom(userEmail)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left leading-tight md:block">
                  <div className="text-xs font-medium text-foreground">{userEmail ?? "Admin"}</div>
                  <div className="text-[11px] text-muted-foreground">Administrator</div>
                </div>
                <ChevronDown size={14} className="hidden text-muted-foreground md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{userEmail ?? "Admin"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut size={14} />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}