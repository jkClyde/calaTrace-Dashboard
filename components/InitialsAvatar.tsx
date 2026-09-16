import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initialsFrom } from "@/lib/initials";

const PALETTE = [
  "bg-branding/15 text-branding",
  "bg-primary-dark/15 text-primary-dark",
  "bg-secondary text-secondary-foreground",
  "bg-muted text-muted-foreground",
];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export default function InitialsAvatar({
  name,
  size = 36,
}: {
  name: string | null | undefined;
  size?: number;
}) {
  const label = name ?? "?";
  return (
    <Avatar style={{ width: size, height: size }}>
      <AvatarFallback className={colorFor(label)}>{initialsFrom(label)}</AvatarFallback>
    </Avatar>
  );
}
