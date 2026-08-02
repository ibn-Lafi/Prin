"use client";

import { Plus, UtensilsCrossed } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import type { Combo } from "@/lib/types";
import { useCart } from "@/hooks/useCart";

export function ComboCard({ combo, onSelect }: { combo: Combo; onSelect: () => void }) {
  const { addItem } = useCart();
  const available = combo.is_available;
  const hasModifiers = combo.modifier_groups.length > 0;

  function handleClick() {
    if (!available) return;
    if (hasModifiers) {
      onSelect();
      return;
    }
    addItem({
      kind: "combo",
      refId: combo.id,
      name: combo.name,
      unitPrice: combo.price,
      quantity: 1,
      modifiers: [],
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!available}
      className="flex w-full flex-col overflow-hidden rounded-2xl bg-[var(--color-brand-card)] text-right shadow-md shadow-black/5 disabled:opacity-70"
    >
      <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-[var(--color-brand-primary-light)]">
        {combo.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={combo.image_url}
            alt={combo.name}
            className={`h-full w-full object-cover ${available ? "" : "grayscale"}`}
          />
        ) : (
          <UtensilsCrossed
            className="h-9 w-9 text-[var(--color-brand-primary)]/40"
            strokeWidth={1.5}
          />
        )}
      </div>
      <div className="flex w-full flex-col gap-1.5 p-3">
        <span className="line-clamp-1 text-sm font-semibold text-[var(--color-brand-text)]">
          {combo.name}
        </span>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[var(--color-brand-primary)]">
            {formatCurrency(combo.price)}
          </span>
          {available ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] shadow-sm">
              <Plus className="h-4 w-4 text-white" strokeWidth={2.5} />
            </span>
          ) : (
            <span className="text-xs font-semibold text-red-600">غير متوفر</span>
          )}
        </div>
      </div>
    </button>
  );
}
