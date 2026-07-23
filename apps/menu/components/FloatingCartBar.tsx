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
    <div className="fixed inset-x-0 bottom-5 z-30 flex justify-center px-4">
      <Link
        href="/cart"
        className="flex items-center gap-2.5 rounded-full bg-[var(--color-brand-text)] px-5 py-3.5 text-sm text-white shadow-xl shadow-black/25"
      >
        <ShoppingBag className="h-4 w-4" strokeWidth={2} />
        <span className="font-semibold">عرض الطلبات ({count})</span>
        <span className="font-bold">{formatCurrency(subtotal)}</span>
      </Link>
    </div>
  );
}
