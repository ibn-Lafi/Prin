"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../hooks/useCart";

export function CartBadgeLink() {
  const { items } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link href="/cart" className="relative flex items-center justify-center p-1">
      <ShoppingBag className="h-6 w-6 text-[var(--color-brand-text)]" strokeWidth={1.75} />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
