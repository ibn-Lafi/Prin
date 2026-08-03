import { Check, Gift } from "lucide-react";
import type { Reward } from "@/lib/types";

export function RewardCard({
  reward,
  pointsBalance,
  selected,
  onSelect,
}: {
  reward: Reward;
  pointsBalance: number | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const canRedeem = pointsBalance !== null && pointsBalance >= reward.points_cost;

  return (
    <button
      type="button"
      disabled={!canRedeem}
      onClick={onSelect}
      className={`flex w-full flex-col overflow-hidden rounded-2xl bg-[var(--color-brand-card)] text-right shadow-md shadow-black/5 ring-2 transition-colors disabled:cursor-not-allowed ${
        selected ? "ring-[var(--color-brand-primary)]" : "ring-transparent"
      }`}
    >
      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-[var(--color-brand-primary-light)]">
        {reward.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={reward.image_url} alt={reward.name} className="h-full w-full object-cover" />
        ) : (
          <Gift className="h-9 w-9 text-[var(--color-brand-primary)]/40" strokeWidth={1.5} />
        )}
        {selected && (
          <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-white">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
        )}
      </div>
      <div className="flex w-full flex-col gap-1.5 p-3">
        <span className="line-clamp-1 text-sm font-semibold text-[var(--color-brand-text)]">
          {reward.name}
        </span>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[var(--color-brand-primary)]">
            {reward.points_cost} نقطة
          </span>
          {pointsBalance !== null && (
            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${
                selected
                  ? "bg-[var(--color-brand-primary)] text-white"
                  : canRedeem
                    ? "bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)]"
                    : "bg-black/5 text-[var(--color-brand-muted)]"
              }`}
            >
              {selected ? "مختارة" : canRedeem ? "رصيدك يكفي" : "غير كافٍ"}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
