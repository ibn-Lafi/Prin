"use client";

import { formatCurrency } from "@brin/utils";
import type { Product } from "@/lib/types";

export function ProductCard({ product, onSelect }: { product: Product; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col gap-2 rounded-lg border p-3 text-right"
    >
      {product.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.image_url}
          alt={product.name}
          className="aspect-square w-full rounded object-cover"
        />
      )}
      <span className="font-semibold">{product.name}</span>
      {product.calories !== null && (
        <span className="text-xs text-gray-500">{product.calories} سعرة</span>
      )}
      <span className="font-bold">{formatCurrency(product.price)}</span>
    </button>
  );
}
