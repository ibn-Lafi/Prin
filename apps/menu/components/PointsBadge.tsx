import { Sparkles } from "lucide-react";

export function PointsBadge({ points }: { points: number }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-[var(--color-brand-card)] px-3 py-2 text-xs font-semibold text-[var(--color-brand-primary)] shadow-sm ring-1 ring-[var(--color-brand-border)]">
      <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
      {points}
    </span>
  );
}
