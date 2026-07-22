"use client";

import Link from "next/link";
import { useCart } from "../hooks/useCart";

export function CartBadgeLink() {
  const { items } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link href="/cart" className="relative">
      السلة
      {count > 0 && (
        <span className="absolute -top-2 -right-3 rounded-full bg-[var(--color-brand-primary)] px-1.5 text-xs text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
