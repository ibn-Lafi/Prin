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
    <nav className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="flex items-center gap-1 rounded-[28px] border border-white/50 bg-white/70 p-1.5 shadow-xl shadow-black/10 backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 rounded-full px-4 py-2.5 transition-colors duration-150 ${
                active ? "bg-[var(--color-brand-primary-light)]" : ""
              }`}
            >
              <Icon
                className={`h-5 w-5 ${active ? "text-[var(--color-brand-primary)]" : "text-[var(--color-brand-text)]"}`}
                strokeWidth={active ? 2.25 : 1.75}
              />
              <span
                className={`text-xs ${
                  active ? "font-semibold text-[var(--color-brand-text)]" : "text-[var(--color-brand-muted)]"
                }`}
              >
                {item.label}
              </span>
              {item.href === "/cart" && cartCount > 0 && (
                <span className="absolute -top-1 -left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1 text-[9px] font-bold text-white">
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
