"use client";

import { useEffect, useState } from "react";
import { Gift, UtensilsCrossed } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import type { Category, Combo, Product, Reward } from "@/lib/types";
import { addItem } from "@/hooks/useOrderTicket";
import { useCheckoutCustomer, ensureRewardsLoaded } from "@/hooks/useCheckoutCustomer";
import { OrderModal } from "@/components/OrderModal";
import { RewardRedeemModal } from "@/components/RewardRedeemModal";

const COMBOS_TAB_ID = "__combos__";
const REWARDS_TAB_ID = "__rewards__";

function isVisible(row: { is_available: boolean; deleted_at: string | null }): boolean {
  return row.is_available && row.deleted_at === null;
}

export function ProductGrid({
  categories,
  products,
  combos,
}: {
  categories: Category[];
  products: Product[];
  combos: Combo[];
}) {
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.id ?? COMBOS_TAB_ID);
  const [selectedItem, setSelectedItem] = useState<
    { item: Product; kind: "product" } | { item: Combo; kind: "combo" } | null
  >(null);
  const [redeemingReward, setRedeemingReward] = useState<Reward | null>(null);

  const { rewards, selectedRewardId, customer, canAfford, selectReward } = useCheckoutCustomer();

  useEffect(() => {
    void ensureRewardsLoaded();
  }, []);

  const visibleCombos = combos.filter(isVisible);
  const visibleProducts = products.filter((p) => isVisible(p) && p.category_id === activeTab);

  function handleRewardTap(reward: Reward) {
    if (selectedRewardId === reward.id) {
      selectReward(null);
      return;
    }
    setRedeemingReward(reward);
  }

  function handleProductTap(product: Product) {
    if (product.modifier_groups.length === 0) {
      addItem({
        kind: "product",
        refId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity: 1,
        modifiers: [],
      });
      return;
    }
    setSelectedItem({ item: product, kind: "product" });
  }

  function handleComboTap(combo: Combo) {
    if (combo.modifier_groups.length === 0) {
      addItem({
        kind: "combo",
        refId: combo.id,
        name: combo.name,
        unitPrice: combo.price,
        quantity: 1,
        modifiers: [],
      });
      return;
    }
    setSelectedItem({ item: combo, kind: "combo" });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2.5 overflow-x-auto border-b border-[var(--color-brand-border)] p-4">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveTab(category.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === category.id
                ? "bg-[var(--color-brand-primary)] text-white"
                : "bg-[var(--color-brand-card)] text-[var(--color-brand-muted)] ring-1 ring-[var(--color-brand-border)]"
            }`}
          >
            {category.name}
          </button>
        ))}
        {visibleCombos.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab(COMBOS_TAB_ID)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === COMBOS_TAB_ID
                ? "bg-[var(--color-brand-primary)] text-white"
                : "bg-[var(--color-brand-card)] text-[var(--color-brand-muted)] ring-1 ring-[var(--color-brand-border)]"
            }`}
          >
            وجبة
          </button>
        )}
        {rewards.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab(REWARDS_TAB_ID)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === REWARDS_TAB_ID
                ? "bg-[var(--color-brand-primary)] text-white"
                : "bg-[var(--color-brand-card)] text-[var(--color-brand-muted)] ring-1 ring-[var(--color-brand-border)]"
            }`}
          >
            <Gift className="h-4 w-4" strokeWidth={1.75} />
            استبدل
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === REWARDS_TAB_ID ? (
          rewards.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--color-brand-muted)]">
              لا توجد مكافآت متاحة حالياً
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 xl:grid-cols-4">
              {rewards.map((reward) => {
                const selected = selectedRewardId === reward.id;
                const affordable = canAfford(reward);
                return (
                  <button
                    key={reward.id}
                    type="button"
                    onClick={() => handleRewardTap(reward)}
                    className={`flex flex-col overflow-hidden rounded-2xl bg-[var(--color-brand-card)] text-right ring-1 transition-transform active:scale-[0.98] ${
                      selected ? "ring-2 ring-[var(--color-brand-primary)]" : "ring-[var(--color-brand-border)]"
                    }`}
                  >
                    <div className="flex aspect-[4/3] items-center justify-center bg-[var(--color-brand-primary-light)]">
                      <Gift className="h-8 w-8 text-[var(--color-brand-primary)]/40" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col gap-1 p-3">
                      <span className="line-clamp-1 font-semibold">{reward.name}</span>
                      <span className="text-xs text-[var(--color-brand-muted)]">
                        قيمتها {formatCurrency(reward.discountAmount)}
                      </span>
                      <span className="font-bold text-[var(--color-brand-primary)]">
                        {reward.pointsCost} نقطة
                      </span>
                      {selected && <span className="text-xs font-medium text-green-700">مطبّقة على الطلب</span>}
                      {!selected && !affordable && (
                        <span className="text-xs text-[var(--color-brand-muted)]">
                          {customer ? "رصيد غير كافٍ" : "يتطلب بحث عن العميل"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          <div className="grid grid-cols-3 gap-3 xl:grid-cols-4">
            {activeTab === COMBOS_TAB_ID
              ? visibleCombos.map((combo) => (
                <button
                  key={combo.id}
                  type="button"
                  onClick={() => handleComboTap(combo)}
                  className="flex flex-col overflow-hidden rounded-2xl bg-[var(--color-brand-card)] text-right ring-1 ring-[var(--color-brand-border)] transition-transform active:scale-[0.98]"
                >
                  <div className="flex aspect-[4/3] items-center justify-center bg-[var(--color-brand-primary-light)]">
                    {combo.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={combo.image_url}
                        alt={combo.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UtensilsCrossed
                        className="h-8 w-8 text-[var(--color-brand-primary)]/40"
                        strokeWidth={1.5}
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 p-3">
                    <span className="line-clamp-1 font-semibold">{combo.name}</span>
                    <span className="font-bold text-[var(--color-brand-primary)]">
                      {formatCurrency(combo.price)}
                    </span>
                  </div>
                </button>
              ))
            : visibleProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductTap(product)}
                  className="flex flex-col overflow-hidden rounded-2xl bg-[var(--color-brand-card)] text-right ring-1 ring-[var(--color-brand-border)] transition-transform active:scale-[0.98]"
                >
                  <div className="flex aspect-[4/3] items-center justify-center bg-[var(--color-brand-primary-light)]">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UtensilsCrossed
                        className="h-8 w-8 text-[var(--color-brand-primary)]/40"
                        strokeWidth={1.5}
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 p-3">
                    <span className="line-clamp-1 font-semibold">{product.name}</span>
                    <span className="font-bold text-[var(--color-brand-primary)]">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <OrderModal item={selectedItem.item} kind={selectedItem.kind} onClose={() => setSelectedItem(null)} />
      )}
      {redeemingReward && (
        <RewardRedeemModal reward={redeemingReward} onClose={() => setRedeemingReward(null)} />
      )}
    </div>
  );
}
