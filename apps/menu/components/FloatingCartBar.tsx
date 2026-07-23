"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import { useCart } from "@/hooks/useCart";

export function FloatingCartBar() {
  const { items, subtotal } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4">
      <Link
        href="/cart"
        className="mx-auto flex max-w-3xl items-center justify-between rounded-2xl bg-[var(--color-brand-primary)] px-5 py-3.5 text-white shadow-lg shadow-black/20"
      >
        <span className="flex items-center gap-2 font-semibold">
          <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
          عرض الطلبات ({count})
        </span>
        <span className="font-bold">{formatCurrency(subtotal)}</span>
      </Link>
    </div>
  );
}
