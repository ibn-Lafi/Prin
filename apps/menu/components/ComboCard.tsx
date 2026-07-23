"use client";

import { Plus, UtensilsCrossed } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import type { Combo } from "@/lib/types";
import { useCart } from "@/hooks/useCart";

export function ComboCard({ combo }: { combo: Combo }) {
  const { addItem } = useCart();

  return (
    <div className="flex items-center gap-3 border-b border-[var(--color-brand-border)] py-3.5 last:border-0">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--color-brand-primary-light)]">
        {combo.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={combo.image_url} alt={combo.name} className="h-full w-full object-cover" />
        ) : (
          <UtensilsCrossed
            className="h-7 w-7 text-[var(--color-brand-primary)]/40"
            strokeWidth={1.5}
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-1 font-semibold">{combo.name}</span>
        {combo.description && (
          <span className="line-clamp-1 text-xs text-[var(--color-brand-muted)]">
            {combo.description}
          </span>
        )}
        <span className="font-bold text-[var(--color-brand-primary)]">
          {formatCurrency(combo.price)}
        </span>
      </div>

      <button
        type="button"
        onClick={() =>
          addItem({
            productId: combo.id,
            name: combo.name,
            unitPrice: combo.price,
            quantity: 1,
            modifiers: [],
          })
        }
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-white"
        aria-label="أضف للسلة"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}
