"use client";

import { formatCurrency } from "@brin/utils";
import type { Combo } from "@/lib/types";
import { useCart } from "@/hooks/useCart";

export function ComboCard({ combo, disabled = false }: { combo: Combo; disabled?: boolean }) {
  const { addItem } = useCart();

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      {combo.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={combo.image_url}
          alt={combo.name}
          className="aspect-square w-full rounded object-cover"
        />
      )}
      <span className="font-semibold">{combo.name}</span>
      {combo.description && <span className="text-xs text-gray-500">{combo.description}</span>}
      <span className="font-bold">{formatCurrency(combo.price)}</span>
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
        className="rounded bg-[var(--color-brand-primary)] px-3 py-2 text-white disabled:opacity-40"
      >
        أضف للسلة
      </button>
    </div>
  );
}
