"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, UtensilsCrossed, type LucideIcon } from "lucide-react";

const SECTIONS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "برجر", icon: UtensilsCrossed },
  { href: "/rewards", label: "مكافآت", icon: Gift },
];

function SectionCard({
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
      className={`flex flex-1 flex-col items-center gap-2 rounded-3xl bg-[var(--color-brand-card)] px-4 py-5 shadow-sm shadow-black/5 ring-1 transition-colors ${
        active ? "ring-[var(--color-brand-primary)]/40" : "ring-black/5"
      }`}
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-full ${
          active ? "bg-[var(--color-brand-primary)]" : "bg-[var(--color-brand-primary-light)]"
        }`}
      >
        <Icon
          className={`h-7 w-7 ${active ? "text-white" : "text-[var(--color-brand-primary)]"}`}
          strokeWidth={1.75}
        />
      </span>
      <span className="text-sm font-bold text-[var(--color-brand-text)]">{label}</span>
    </Link>
  );
}

// كل قسم (برجر / مكافآت) صفحة مستقلة فعلياً — نفس أسلوب بطاقات الصورة
// المرجعية (أيقونة داخل دائرة أعلى بطاقة بيضاء مدورة، والاسم أسفلها).
export function SectionSwitcher() {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-2 gap-3 px-4 pb-3">
      {SECTIONS.map((section) => (
        <SectionCard
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
