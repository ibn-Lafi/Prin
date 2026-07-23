"use client";

import { Plus, UtensilsCrossed } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import type { Combo } from "@/lib/types";
import { useCart } from "@/hooks/useCart";

export function ComboCard({ combo, disabled = false }: { combo: Combo; disabled?: boolean }) {
  const { addItem } = useCart();

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-[var(--color-brand-card)] shadow-sm ring-1 ring-[var(--color-brand-border)]">
      <div className="flex aspect-square w-full items-center justify-center bg-[var(--color-brand-primary-light)]">
        {combo.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={combo.image_url} alt={combo.name} className="h-full w-full object-cover" />
        ) : (
          <UtensilsCrossed
            className="h-9 w-9 text-[var(--color-brand-primary)]/40"
            strokeWidth={1.5}
          />
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <span className="line-clamp-1 font-semibold">{combo.name}</span>
        {combo.description && (
          <span className="line-clamp-1 text-xs text-[var(--color-brand-muted)]">
            {combo.description}
          </span>
        )}
        <div className="mt-1 flex items-center justify-between">
          <span className="font-bold text-[var(--color-brand-primary)]">
            {formatCurrency(combo.price)}
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              addItem({
                productId: combo.id,
                name: combo.name,
                unitPrice: combo.price,
                quantity: 1,
                modifiers: [],
              })
            }
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-white disabled:opacity-40"
            aria-label="أضف للسلة"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
