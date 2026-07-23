"use client";

import { UtensilsCrossed } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import type { Product } from "@/lib/types";

export function ProductCard({ product, onSelect }: { product: Product; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="flex flex-col text-right">
      <div className="mb-2.5 flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-brand-primary-light)]">
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
      <span className="line-clamp-1 font-semibold">{product.name}</span>
      {product.calories !== null && (
        <span className="text-sm text-[var(--color-brand-muted)]">{product.calories} سعرة</span>
      )}
      <span className="mt-0.5 font-bold">{formatCurrency(product.price)}</span>
    </button>
  );
}
