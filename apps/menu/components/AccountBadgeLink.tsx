import Link from "next/link";
import { User } from "lucide-react";

export function AccountBadgeLink() {
  return (
    <Link
      href="/account"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-card)] shadow-[0_2px_0_0_rgba(33,28,28,0.1)] ring-1 ring-[var(--color-brand-border)] transition-all duration-100 active:translate-y-0.5 active:shadow-none"
      aria-label="حسابي"
    >
      <User className="h-4.5 w-4.5 text-[var(--color-brand-text)]" strokeWidth={1.75} />
    </Link>
  );
}
