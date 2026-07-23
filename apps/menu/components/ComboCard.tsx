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
      className="flex flex-col text-right"
    >
      <div className="relative mb-2.5 flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-brand-primary-light)]">
        {combo.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={combo.image_url} alt={combo.name} className="h-full w-full object-cover" />
        ) : (
          <UtensilsCrossed
            className="h-9 w-9 text-[var(--color-brand-primary)]/40"
            strokeWidth={1.5}
          />
        )}
        <span className="absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--color-brand-primary)] shadow-md">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </span>
      </div>
      <span className="line-clamp-1 font-semibold">{combo.name}</span>
      {combo.description && (
        <span className="line-clamp-1 text-sm text-[var(--color-brand-muted)]">
          {combo.description}
        </span>
      )}
      <span className="mt-0.5 font-bold">{formatCurrency(combo.price)}</span>
    </button>
  );
}
