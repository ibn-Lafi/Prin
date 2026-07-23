"use client";

import { Flame, Plus, UtensilsCrossed } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import type { Product } from "@/lib/types";

export function ProductCard({ product, onSelect }: { product: Product; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 border-b border-[var(--color-brand-border)] py-3.5 text-right last:border-0"
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--color-brand-primary-light)]">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <UtensilsCrossed
            className="h-7 w-7 text-[var(--color-brand-primary)]/40"
            strokeWidth={1.5}
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-1 font-semibold">{product.name}</span>
        {product.calories !== null && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[var(--color-brand-background)] px-2 py-0.5 text-xs text-[var(--color-brand-muted)]">
            <Flame className="h-3 w-3" strokeWidth={1.75} />
            {product.calories} سعرة
          </span>
        )}
        <span className="font-bold text-[var(--color-brand-primary)]">
          {formatCurrency(product.price)}
        </span>
      </div>

      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-white"
        aria-hidden
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </span>
    </button>
  );
}
