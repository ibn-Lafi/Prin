"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/hooks/useCart";

const NAV_ITEMS = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/cart", label: "السلة", icon: ShoppingBag },
  { href: "/account", label: "حسابي", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="flex items-center gap-1 rounded-full bg-[var(--color-brand-text)] p-1.5 shadow-xl shadow-black/25">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold transition-colors duration-150 ${
                active ? "bg-[var(--color-brand-primary)] text-white" : "text-white/70"
              }`}
            >
              <Icon className="h-4.5 w-4.5" strokeWidth={2} />
              {active && <span>{item.label}</span>}
              {item.href === "/cart" && cartCount > 0 && (
                <span className="absolute -top-1 -left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-[var(--color-brand-primary)]">
                  {cartCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
