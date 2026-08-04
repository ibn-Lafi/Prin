import { Gift } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import type { Reward } from "@/lib/types";

export function RewardCard({
  reward,
  pointsBalance,
  onSelect,
}: {
  reward: Reward;
  pointsBalance: number | null;
  onSelect: () => void;
}) {
  const canRedeem = pointsBalance !== null && pointsBalance >= reward.points_cost;

  return (
    <button
      type="button"
      onClick={canRedeem ? onSelect : undefined}
      disabled={!canRedeem}
      className="flex w-full flex-col overflow-hidden rounded-2xl bg-[var(--color-brand-card)] text-right shadow-md shadow-black/5 disabled:opacity-70"
    >
      <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-[var(--color-brand-primary-light)]">
        {reward.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reward.image_url}
            alt={reward.name}
            className={`h-full w-full object-cover ${canRedeem ? "" : "grayscale"}`}
          />
        ) : (
          <Gift className="h-9 w-9 text-[var(--color-brand-primary)]/40" strokeWidth={1.5} />
        )}
      </div>
      <div className="flex w-full flex-col gap-1.5 p-3">
        <span className="line-clamp-1 text-sm font-semibold text-[var(--color-brand-text)]">
          {reward.name}
        </span>
        <span className="text-xs text-[var(--color-brand-muted)]">
          قيمتها {formatCurrency(reward.discount_amount)}
        </span>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[var(--color-brand-primary)]">
            {reward.points_cost} نقطة
          </span>
          {canRedeem ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] shadow-sm">
              <Gift className="h-4 w-4 text-white" strokeWidth={2.5} />
            </span>
          ) : (
            <span className="text-xs font-semibold text-red-600">غير كافٍ</span>
          )}
        </div>
      </div>
    </button>
  );
}
