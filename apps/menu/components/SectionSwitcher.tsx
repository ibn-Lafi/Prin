"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, UtensilsCrossed, type LucideIcon } from "lucide-react";

const SECTIONS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "برجر", icon: UtensilsCrossed },
  { href: "/rewards", label: "مكافآت", icon: Gift },
];

function SectionTab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm transition-colors ${
        active
          ? "bg-[var(--color-brand-primary-light)] font-bold text-[var(--color-brand-text)]"
          : "font-medium text-[var(--color-brand-muted)]"
      }`}
    >
      <Icon
        className={`h-4 w-4 ${active ? "text-[var(--color-brand-primary)]" : ""}`}
        strokeWidth={active ? 2.25 : 1.75}
      />
      {label}
    </Link>
  );
}

// كل قسم (برجر / مكافآت) صفحة مستقلة فعلياً — مفتاح مدمج (segmented
// control) بحاوية واحدة وظل واحد بدل بطاقتين منفصلتين، أخف وأبسط بصرياً
// وبارتفاع أصغر بكثير من نمط البطاقات السابق.
export function SectionSwitcher() {
  const pathname = usePathname();

  return (
    <div className="mx-4 mb-3 flex items-center gap-1 rounded-2xl bg-[var(--color-brand-card)] p-1.5 shadow-sm shadow-black/5">
      {SECTIONS.map((section) => (
        <SectionTab
          key={section.href}
          href={section.href}
          label={section.label}
          icon={section.icon}
          active={section.href === "/" ? pathname === "/" : pathname.startsWith(section.href)}
        />
      ))}
    </div>
  );
}
