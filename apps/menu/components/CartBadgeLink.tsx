"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../hooks/useCart";

export function CartBadgeLink() {
  const { items } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href="/cart"
      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-card)] shadow-[0_2px_0_0_rgba(33,28,28,0.1)] ring-1 ring-[var(--color-brand-border)] transition-all duration-100 active:translate-y-0.5 active:shadow-none"
    >
      <ShoppingBag className="h-4.5 w-4.5 text-[var(--color-brand-text)]" strokeWidth={1.75} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
