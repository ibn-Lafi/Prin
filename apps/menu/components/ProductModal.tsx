"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { formatCurrency, roundMoney } from "@brin/utils";
import type { Product } from "@/lib/types";
import { useCart, type CartModifier } from "@/hooks/useCart";

export function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
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

  const missingRequiredGroups = product.modifier_groups.filter(
    (group) => group.is_required && (selections[group.id]?.length ?? 0) < group.min_select,
  );

  const selectedModifiers: CartModifier[] = useMemo(
    () =>
      product.modifier_groups.flatMap((group) =>
        (selections[group.id] ?? []).map((modifierId) => {
          const modifier = group.modifiers.find((m) => m.id === modifierId);
          return { modifierId, name: modifier?.name ?? "", priceDelta: modifier?.price_delta ?? 0 };
        }),
      ),
    [product.modifier_groups, selections],
  );

  const modifiersTotal = selectedModifiers.reduce((sum, m) => sum + m.priceDelta, 0);
  const totalPrice = roundMoney((product.price + modifiersTotal) * quantity);

  function handleAddToCart() {
    if (missingRequiredGroups.length > 0) return;

    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity,
      modifiers: selectedModifiers,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[var(--color-brand-card)] p-5 sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{product.name}</h2>
            {product.description && (
              <p className="text-sm text-[var(--color-brand-muted)]">{product.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {product.modifier_groups.map((group) => (
          <fieldset key={group.id} className="mb-4">
            <legend className="mb-2 font-semibold">
              {group.name}
              {group.is_required && (
                <span className="mr-2 rounded-full bg-[var(--color-brand-primary-light)] px-2 py-0.5 text-xs font-normal text-[var(--color-brand-primary)]">
                  إجباري
                </span>
              )}
            </legend>
            <div className="flex flex-col gap-1">
              {group.modifiers
                .filter((m) => m.is_available)
                .map((modifier) => {
                  const checked = (selections[group.id] ?? []).includes(modifier.id);
                  return (
                    <label
                      key={modifier.id}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors ${
                        checked
                          ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary-light)]"
                          : "border-[var(--color-brand-border)]"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type={group.max_select === 1 ? "radio" : "checkbox"}
                          name={group.id}
                          checked={checked}
                          onChange={() => toggleModifier(group.id, modifier.id, group.max_select)}
                          className="accent-[var(--color-brand-primary)]"
                        />
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
        ))}

        <div className="mb-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-background)] text-[var(--color-brand-text)] ring-1 ring-[var(--color-brand-border)]"
            aria-label="إنقاص الكمية"
          >
            <Minus className="h-4 w-4" strokeWidth={2} />
          </button>
          <span className="min-w-6 text-center text-lg font-bold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-background)] text-[var(--color-brand-text)] ring-1 ring-[var(--color-brand-border)]"
            aria-label="زيادة الكمية"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {missingRequiredGroups.length > 0 && (
          <p className="mb-2 text-center text-sm text-[var(--color-brand-primary)]">
            لازم تختار: {missingRequiredGroups.map((g) => g.name).join("، ")}
          </p>
        )}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={missingRequiredGroups.length > 0}
          className="w-full rounded-2xl bg-[var(--color-brand-primary)] px-4 py-3.5 font-semibold text-white disabled:opacity-50"
        >
          أضف للسلة — {formatCurrency(totalPrice)}
        </button>
      </div>
    </div>
  );
}
