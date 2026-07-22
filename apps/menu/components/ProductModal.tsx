"use client";

import { useMemo, useState } from "react";
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
    <div className="fixed inset-0 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{product.name}</h2>
            {product.description && <p className="text-sm text-gray-500">{product.description}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-gray-400">
            ✕
          </button>
        </div>

        {product.modifier_groups.map((group) => (
          <fieldset key={group.id} className="mb-4">
            <legend className="mb-2 font-semibold">
              {group.name}
              {group.is_required && <span className="text-xs text-red-600"> (إجباري)</span>}
            </legend>
            <div className="flex flex-col gap-2">
              {group.modifiers
                .filter((m) => m.is_available)
                .map((modifier) => (
                  <label key={modifier.id} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <input
                        type={group.max_select === 1 ? "radio" : "checkbox"}
                        name={group.id}
                        checked={(selections[group.id] ?? []).includes(modifier.id)}
                        onChange={() => toggleModifier(group.id, modifier.id, group.max_select)}
                      />
                      {modifier.name}
                    </span>
                    {modifier.price_delta > 0 && (
                      <span>+{formatCurrency(modifier.price_delta)}</span>
                    )}
                  </label>
                ))}
            </div>
          </fieldset>
        ))}

        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="h-8 w-8 rounded-full border"
          >
            −
          </button>
          <span>{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="h-8 w-8 rounded-full border"
          >
            +
          </button>
        </div>

        {missingRequiredGroups.length > 0 && (
          <p className="mb-2 text-sm text-red-600">
            لازم تختار: {missingRequiredGroups.map((g) => g.name).join("، ")}
          </p>
        )}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={missingRequiredGroups.length > 0}
          className="w-full rounded bg-[var(--color-brand-primary)] px-4 py-3 text-white disabled:opacity-50"
        >
          أضف للسلة — {formatCurrency(totalPrice)}
        </button>
      </div>
    </div>
  );
}
