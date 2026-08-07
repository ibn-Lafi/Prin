"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import { useCart } from "@/hooks/useCart";

// شريط سلة ثابت يظهر فوق شريط التنقل السفلي أثناء التصفح — يعطي العميل
// إجمالي طلبه ووصولاً بضغطة واحدة للسلة بدل البحث عن أيقونة السلة بالتنقل.
// يختفي بصفحتي السلة والدفع نفسهما لأن الإجمالي يظهر هناك أصلاً.
export function CartBar() {
  const pathname = usePathname();
  const { items, subtotal } = useCart();

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const hidden = pathname.startsWith("/cart") || pathname.startsWith("/checkout");

  if (hidden || cartCount === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-[88px] z-30 px-4">
      <Link
        href="/cart"
        className="mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl bg-[var(--color-brand-primary)] px-4 py-3.5 shadow-xl shadow-black/20 transition-transform active:scale-[0.98]"
      >
        <span className="flex items-center gap-2.5 text-sm font-semibold text-white">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
            <ShoppingBag className="h-4 w-4" strokeWidth={2} />
          </span>
          {cartCount} {cartCount === 1 ? "صنف" : "أصناف"} · {formatCurrency(subtotal)}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-white">
          اطلب الآن
          <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
        </span>
      </Link>
    </div>
  );
}
