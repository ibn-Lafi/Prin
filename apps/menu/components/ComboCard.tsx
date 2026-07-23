"use client";

import { Plus, UtensilsCrossed } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import type { Combo } from "@/lib/types";
import { useCart } from "@/hooks/useCart";

export function ComboCard({ combo }: { combo: Combo }) {
  const { addItem } = useCart();

  return (
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
      className="flex w-full flex-col overflow-hidden rounded-2xl text-right shadow-md shadow-black/5"
    >
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-[var(--color-brand-primary-light)]">
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
      <div className="flex w-full flex-col gap-2 bg-[var(--color-brand-primary)] p-3">
        <span className="line-clamp-1 font-semibold text-white">{combo.name}</span>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {combo.description && (
              <span className="line-clamp-1 text-xs text-white/70">{combo.description}</span>
            )}
            <span className="font-bold text-white">{formatCurrency(combo.price)}</span>
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
            <Plus className="h-4 w-4 text-[var(--color-brand-primary)]" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </button>
  );
}
