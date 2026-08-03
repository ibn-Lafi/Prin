"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Minus, Plus, X } from "lucide-react";
import { formatCurrency, roundMoney } from "@brin/utils";
import type { ModifierGroup } from "@/lib/types";
import { addItem, type TicketModifier } from "@/hooks/useOrderTicket";

type OrderableItem = {
  id: string;
  name: string;
  price: number;
  modifier_groups: ModifierGroup[];
};

export function OrderModal({
  item,
  kind,
  onClose,
}: {
  item: OrderableItem;
  kind: "product" | "combo";
  onClose: () => void;
}) {
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

  const selectedModifiers: TicketModifier[] = useMemo(
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

  function handleAdd() {
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-[var(--color-brand-card)]">
        <div className="flex items-center justify-between border-b border-[var(--color-brand-border)] p-4">
          <h2 className="text-lg font-bold">{item.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-background)]"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {item.modifier_groups.map((group) => {
            const selectedCount = selections[group.id]?.length ?? 0;
            return (
              <fieldset key={group.id} className="mb-5">
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
                <div className="flex flex-col">
                  {group.modifiers
                    .filter((m) => m.is_available)
                    .map((modifier) => {
                      const checked = (selections[group.id] ?? []).includes(modifier.id);
                      return (
                        <label
                          key={modifier.id}
                          className="flex items-center justify-between border-b border-[var(--color-brand-border)] py-3 last:border-0"
                        >
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
          <div className="mb-3 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-background)] ring-1 ring-[var(--color-brand-border)]"
              aria-label="إنقاص الكمية"
            >
              <Minus className="h-4 w-4" strokeWidth={2} />
            </button>
            <span className="min-w-6 text-center text-lg font-bold">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-background)] ring-1 ring-[var(--color-brand-border)]"
              aria-label="زيادة الكمية"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          {missingRequiredGroups.length > 0 && (
            <p className="mb-2 text-center text-sm text-[var(--color-brand-primary)]">
              يجب اختيار: {missingRequiredGroups.map((g) => g.name).join("، ")}
            </p>
          )}
          <button
            type="button"
            onClick={handleAdd}
            disabled={missingRequiredGroups.length > 0}
            className="w-full rounded-2xl bg-[var(--color-brand-primary)] px-4 py-3.5 font-semibold text-white disabled:opacity-50"
          >
            أضف للتذكرة — {formatCurrency(totalPrice)}
          </button>
        </div>
      </div>
    </div>
  );
}
