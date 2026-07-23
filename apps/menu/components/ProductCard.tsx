"use client";

import { Flame, UtensilsCrossed } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import type { Product } from "@/lib/types";

export function ProductCard({ product, onSelect }: { product: Product; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col overflow-hidden rounded-2xl bg-[var(--color-brand-card)] text-right shadow-sm ring-1 ring-[var(--color-brand-border)] transition-transform active:scale-[0.98]"
    >
      <div className="flex aspect-square w-full items-center justify-center bg-[var(--color-brand-primary-light)]">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <UtensilsCrossed
            className="h-9 w-9 text-[var(--color-brand-primary)]/40"
            strokeWidth={1.5}
          />
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <span className="line-clamp-1 font-semibold">{product.name}</span>
        {product.calories !== null && (
          <span className="flex items-center gap-1 text-xs text-[var(--color-brand-muted)]">
            <Flame className="h-3.5 w-3.5" strokeWidth={1.75} />
            {product.calories} سعرة
          </span>
        )}
        <span className="mt-1 font-bold text-[var(--color-brand-primary)]">
          {formatCurrency(product.price)}
        </span>
      </div>
    </button>
  );
}
