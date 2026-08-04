"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/hooks/useCart";

const NAV_ITEMS = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/cart", label: "السلة", icon: ShoppingBag },
  { href: "/orders", label: "الطلبات", icon: ClipboardList },
  { href: "/account", label: "حسابي", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 px-4">
      <div className="mx-auto flex w-full max-w-md items-center rounded-[28px] border border-white/50 bg-white/70 p-2 shadow-xl shadow-black/10 backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-3xl py-3 transition-colors duration-150 ${
                active ? "bg-[var(--color-brand-primary-light)]" : ""
              }`}
            >
              <span className="relative">
                <Icon
                  className={`h-6 w-6 ${active ? "text-[var(--color-brand-primary)]" : "text-[var(--color-brand-text)]"}`}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                {item.href === "/cart" && cartCount > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1 text-[9px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </span>
              <span
                className={`text-xs ${
                  active ? "font-semibold text-[var(--color-brand-text)]" : "text-[var(--color-brand-muted)]"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
