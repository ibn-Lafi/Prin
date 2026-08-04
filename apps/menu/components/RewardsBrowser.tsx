"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import type { Reward } from "@/lib/types";
import { RewardCard } from "@/components/RewardCard";
import { SectionSwitcher } from "@/components/SectionSwitcher";
import { FlatTab, TabRow } from "@/components/MenuTabs";

function matchesQuery(name: string, query: string): boolean {
  return !query || name.toLowerCase().includes(query);
}

export function RewardsBrowser({
  rewards,
  pointsBalance,
}: {
  rewards: Reward[];
  pointsBalance: number | null;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { selectedRewardId, selectReward, addItem } = useCart();

  // مكافأة مربوطة بصنف/وجبة حقيقية (مثل "وجبة كلاسيك مجانية") يُقدر يستبدلها
  // العميل لوحدها بدون شراء أي شيء إضافي — الصنف/الوجبة نفسها تُضاف للسلة
  // تلقائياً هنا (خصمها لاحقاً بالدفع = سعرها بالضبط، فتصير مجانية فعلياً).
  // مكافأة عامة (خصم نقدي بدون ربط) تبقى تحتاج العميل يضيف صنفاً بنفسه.
  function handleRewardTap(reward: Reward) {
    if (reward.linkedItem && selectedRewardId !== reward.id) {
      addItem({
        kind: reward.linkedItem.kind,
        refId: reward.linkedItem.refId,
        name: reward.name,
        unitPrice: reward.discount_amount,
        quantity: 1,
        modifiers: [],
      });
    }
    selectReward(reward.id);
    router.push("/cart");
  }

  const q = query.trim().toLowerCase();
  const visibleRewards = rewards.filter((r) => matchesQuery(r.name, q));

  return (
    <main className="mx-auto max-w-5xl pb-32">
      <div className="relative z-10 -mt-7 px-4">
        <label className="flex items-center gap-2.5 rounded-full bg-[var(--color-brand-card)] px-4 py-3.5 shadow-lg shadow-black/10 ring-1 ring-black/5">
          <Search className="h-4.5 w-4.5 shrink-0 text-[var(--color-brand-muted)]" strokeWidth={2} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في المكافآت..."
            className="w-full bg-transparent text-sm text-[var(--color-brand-text)] outline-none placeholder:text-[var(--color-brand-muted)]"
          />
        </label>
      </div>

      <div className="sticky top-0 z-20 mt-5 bg-[var(--color-brand-background)]/95 pb-1 backdrop-blur">
        <SectionSwitcher />

        <TabRow>
          <FlatTab label="استبدل" active onClick={() => {}} />
        </TabRow>
      </div>

      <div className="px-4 pt-4">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-[var(--color-brand-muted)]">
            اختر مكافأة لاستبدالها — تُطبَّق تلقائياً على طلبك بصفحة السلة.
          </p>

          {visibleRewards.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--color-brand-muted)]">
              لا توجد مكافآت متاحة حالياً.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
              {visibleRewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  pointsBalance={pointsBalance}
                  onSelect={() => handleRewardTap(reward)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
