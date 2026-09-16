import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function StatCard({
  icon: Icon,
  iconClass,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  value: string | number;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition hover:border-primary/40 hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-5">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}>
            <Icon size={20} strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-2xl font-medium text-foreground">{value}</div>
            <div className="truncate text-xs text-muted-foreground">{label}</div>
          </div>
          <ArrowUpRight size={14} className="ml-auto shrink-0 text-muted-foreground/50" />
        </CardContent>
      </Card>
    </Link>
  );
}
