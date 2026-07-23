"use client";

import Link from "next/link";
import { Clock, CreditCard, MapPin, Phone } from "lucide-react";
import { calculateTax, formatCurrency, roundMoney } from "@brin/utils";
import { useCart } from "@/hooks/useCart";

export function CheckoutView({
  customerPhone,
  taxRatePercent,
}: {
  customerPhone: string;
  taxRatePercent: number;
}) {
  const { items, itemTotal, subtotal } = useCart();

  const tax = calculateTax(subtotal, taxRatePercent);
  const total = roundMoney(subtotal + tax);

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 text-center">
        <p className="text-[var(--color-brand-muted)]">سلتك فاضية.</p>
        <Link href="/" className="mt-4 inline-block text-[var(--color-brand-primary)]">
          تصفّح المنيو
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">تأكيد الطلب</h1>

      <section className="mb-4 flex flex-col gap-2 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
        <p className="mb-1 font-semibold">معلومات الاستلام</p>
        <p className="flex items-center gap-2 text-sm text-[var(--color-brand-muted)]">
          <Phone className="h-4 w-4" strokeWidth={1.75} />
          {customerPhone}
        </p>
        <p className="flex items-center gap-2 text-sm text-[var(--color-brand-muted)]">
          <MapPin className="h-4 w-4" strokeWidth={1.75} />
          استلام من الفرع (Counter Service)
        </p>
      </section>

      <section className="mb-4 flex flex-col gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
        {items.map((item) => (
          <div
            key={item.cartItemId}
            className="flex items-start justify-between border-b border-[var(--color-brand-border)] pb-3 last:border-0 last:pb-0"
          >
            <div>
              <p className="font-semibold">
                {item.name} × {item.quantity}
              </p>
              {item.modifiers.length > 0 && (
                <p className="text-xs text-[var(--color-brand-muted)]">
                  {item.modifiers.map((m) => m.name).join("، ")}
                </p>
              )}
            </div>
            <span className="font-bold">{formatCurrency(itemTotal(item))}</span>
          </div>
        ))}
      </section>

      <section className="mb-6 flex flex-col gap-1.5 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
        <div className="flex justify-between text-sm text-[var(--color-brand-muted)]">
          <span>المجموع الفرعي</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-[var(--color-brand-muted)]">
          <span>الضريبة ({taxRatePercent}%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-[var(--color-brand-border)] pt-2 text-lg font-bold">
          <span>الإجمالي</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-[var(--color-brand-border)] p-4 text-center">
        <Clock className="mx-auto mb-2 h-6 w-6 text-[var(--color-brand-muted)]" strokeWidth={1.5} />
        <p className="mb-3 text-sm text-[var(--color-brand-muted)]">
          الدفع الإلكتروني (مدى / Apple Pay / بطاقات) قيد التفعيل حالياً — الطلبات الإلكترونية غير
          متاحة مؤقتاً.
        </p>
        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-brand-border)] px-4 py-3.5 font-semibold text-[var(--color-brand-muted)]"
        >
          <CreditCard className="h-4 w-4" strokeWidth={1.75} />
          الدفع — قريباً
        </button>
      </section>
    </main>
  );
}
