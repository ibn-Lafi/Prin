"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Flame, Minus, Plus, UtensilsCrossed, X } from "lucide-react";
import { formatCurrency, roundMoney } from "@brin/utils";
import type { ModifierGroup } from "@/lib/types";
import { useCart, type CartModifier } from "@/hooks/useCart";

type OrderableItem = {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  calories?: number | null;
  image_url: string | null;
  modifier_groups: ModifierGroup[];
};

export function ProductModal({
  item,
  kind,
  onClose,
}: {
  item: OrderableItem;
  kind: "product" | "combo";
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  function toggleModifier(groupId: string, modifierId: string, maxSelect: number) {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      const isSelected = current.includes(modifierId);

      if (isSelected) {
        return { ...prev, [groupId]: current.filter((id) => id !== modifierId) };
      }

      if (maxSelect === 1) {
        return { ...prev, [groupId]: [modifierId] };
      }

      if (current.length >= maxSelect) {
        return prev;
      }

      return { ...prev, [groupId]: [...current, modifierId] };
    });
  }

  const missingRequiredGroups = item.modifier_groups.filter(
    (group) => group.is_required && (selections[group.id]?.length ?? 0) < group.min_select,
  );

  const selectedModifiers: CartModifier[] = useMemo(
    () =>
      item.modifier_groups.flatMap((group) =>
        (selections[group.id] ?? []).map((modifierId) => {
          const modifier = group.modifiers.find((m) => m.id === modifierId);
          return { modifierId, name: modifier?.name ?? "", priceDelta: modifier?.price_delta ?? 0 };
        }),
      ),
    [item.modifier_groups, selections],
  );

  const modifiersTotal = selectedModifiers.reduce((sum, m) => sum + m.priceDelta, 0);
  const totalPrice = roundMoney((item.price + modifiersTotal) * quantity);

  function handleAddToCart() {
    if (missingRequiredGroups.length > 0) return;

    addItem({
      kind,
      refId: item.id,
      name: item.name,
      unitPrice: item.price,
      quantity,
      modifiers: selectedModifiers,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-[var(--color-brand-card)] sm:rounded-3xl">
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-brand-background)] shadow-sm"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
          <div className="flex aspect-[4/3] w-full items-center justify-center px-12 pt-14 pb-6">
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt={item.name} className="h-full w-full object-contain" />
            ) : (
              <UtensilsCrossed
                className="h-16 w-16 text-[var(--color-brand-primary)]/30"
                strokeWidth={1.25}
              />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <h2 className="text-xl font-bold text-[var(--color-brand-text)]">{item.name}</h2>
          {item.description && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-brand-muted)]">
              {item.description}
            </p>
          )}
          {item.calories != null && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--color-brand-muted)]">
              <Flame className="h-3.5 w-3.5" strokeWidth={1.75} />
              {item.calories} سعرة حرارية
            </p>
          )}
          <p className="mt-3 text-lg font-extrabold text-[var(--color-brand-text)]">
            {formatCurrency(item.price)}
          </p>

          {item.modifier_groups.map((group) => {
            const selectedCount = selections[group.id]?.length ?? 0;
            return (
              <fieldset key={group.id} className="mt-6">
                <legend className="mb-1 flex w-full items-center justify-between">
                  <span className="font-semibold">
                    {group.name}
                    {group.is_required && (
                      <span className="mr-2 rounded-full bg-[var(--color-brand-primary-light)] px-2 py-0.5 text-xs font-normal text-[var(--color-brand-primary)]">
                        إجباري
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-[var(--color-brand-muted)]">
                    {selectedCount}/{group.max_select}
                  </span>
                </legend>
                <div className="flex flex-col divide-y divide-[var(--color-brand-border)]">
                  {group.modifiers
                    .filter((m) => m.is_available)
                    .map((modifier) => {
                      const checked = (selections[group.id] ?? []).includes(modifier.id);
                      return (
                        <label key={modifier.id} className="flex items-center justify-between py-3">
                          <span className="flex items-center gap-2.5">
                            <input
                              type={group.max_select === 1 ? "radio" : "checkbox"}
                              name={group.id}
                              checked={checked}
                              onChange={() => toggleModifier(group.id, modifier.id, group.max_select)}
                              className="sr-only"
                            />
                            {checked ? (
                              <CheckCircle2
                                className="h-5 w-5 text-[var(--color-brand-primary)]"
                                strokeWidth={2}
                              />
                            ) : (
                              <Circle
                                className="h-5 w-5 text-[var(--color-brand-border)]"
                                strokeWidth={2}
                              />
                            )}
                            {modifier.name}
                          </span>
                          {modifier.price_delta > 0 && (
                            <span className="text-sm text-[var(--color-brand-muted)]">
                              +{formatCurrency(modifier.price_delta)}
                            </span>
                          )}
                        </label>
                      );
                    })}
                </div>
              </fieldset>
            );
          })}
        </div>

        <div className="shrink-0 border-t border-[var(--color-brand-border)] p-4">
          {missingRequiredGroups.length > 0 && (
            <p className="mb-2 text-center text-sm text-[var(--color-brand-primary)]">
              يرجى اختيار: {missingRequiredGroups.map((g) => g.name).join("، ")}
            </p>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-brand-background)] px-3 py-2.5 ring-1 ring-[var(--color-brand-border)]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="text-[var(--color-brand-text)]"
                aria-label="إنقاص الكمية"
              >
                <Minus className="h-4 w-4" strokeWidth={2} />
              </button>
              <span className="min-w-5 text-center font-bold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="text-[var(--color-brand-text)]"
                aria-label="زيادة الكمية"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={missingRequiredGroups.length > 0}
              className="flex-1 rounded-2xl bg-[var(--color-brand-primary)] px-4 py-3.5 font-semibold text-white disabled:opacity-50"
            >
              أضف إلى السلة — {formatCurrency(totalPrice)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
