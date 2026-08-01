"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Tags, UtensilsCrossed, Sandwich, Users, Gift, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/categories", label: "الفئات", icon: Tags },
  { href: "/products", label: "المنتجات", icon: UtensilsCrossed },
  { href: "/combos", label: "الوجبات", icon: Sandwich },
  { href: "/employees", label: "الموظفون", icon: Users },
  { href: "/rewards", label: "الولاء والمكافآت", icon: Gift },
  { href: "/settings", label: "الإعدادات العامة", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)]"
                : "text-[var(--color-brand-muted)] hover:bg-[var(--color-brand-background)]"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
