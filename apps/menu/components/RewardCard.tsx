import { Gift } from "lucide-react";
import type { Reward } from "@/lib/types";

export function RewardCard({
  reward,
  pointsBalance,
}: {
  reward: Reward;
  pointsBalance: number | null;
}) {
  const canRedeem = pointsBalance !== null && pointsBalance >= reward.points_cost;

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl bg-[var(--color-brand-card)] text-right shadow-md shadow-black/5">
      <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-[var(--color-brand-primary-light)]">
        {reward.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={reward.image_url} alt={reward.name} className="h-full w-full object-cover" />
        ) : (
          <Gift className="h-9 w-9 text-[var(--color-brand-primary)]/40" strokeWidth={1.5} />
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
                canRedeem
                  ? "bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)]"
                  : "bg-black/5 text-[var(--color-brand-muted)]"
              }`}
            >
              {canRedeem ? "رصيدك يكفي" : "غير كافٍ"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
