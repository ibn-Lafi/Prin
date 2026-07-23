"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { calculateTax, formatCurrency, roundMoney } from "@brin/utils";
import { useCart } from "@/hooks/useCart";

export function CartView({ taxRatePercent }: { taxRatePercent: number }) {
  const { items, itemTotal, updateQuantity, removeItem, subtotal } = useCart();

  const tax = calculateTax(subtotal, taxRatePercent);
  const total = roundMoney(subtotal + tax);

  if (items.length === 0) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
        <ShoppingBag
          className="mb-3 h-12 w-12 text-[var(--color-brand-border)]"
          strokeWidth={1.25}
        />
        <p className="text-[var(--color-brand-muted)]">سلتك فاضية.</p>
        <Link
          href="/"
          className="mt-4 rounded-2xl bg-[var(--color-brand-primary)] px-6 py-2.5 font-semibold text-white"
        >
          تصفّح المنيو
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">سلتي</h1>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.cartItemId}
            className="rounded-2xl bg-[var(--color-brand-card)] p-3.5 shadow-sm ring-1 ring-[var(--color-brand-border)]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{item.name}</p>
                {item.modifiers.length > 0 && (
                  <p className="text-xs text-[var(--color-brand-muted)]">
                    {item.modifiers.map((m) => m.name).join("، ")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.cartItemId)}
                className="p-1 text-[var(--color-brand-muted)]"
                aria-label="حذف"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand-background)] ring-1 ring-[var(--color-brand-border)]"
                  aria-label="إنقاص الكمية"
                >
                  <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
                <span className="min-w-4 text-center font-medium">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand-background)] ring-1 ring-[var(--color-brand-border)]"
                  aria-label="زيادة الكمية"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
              <span className="font-bold text-[var(--color-brand-primary)]">
                {formatCurrency(itemTotal(item))}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-1.5 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
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
      </div>

      <Link
        href="/checkout"
        className="mt-4 block rounded-2xl bg-[var(--color-brand-primary)] px-4 py-3.5 text-center font-semibold text-white"
      >
        متابعة الطلب
      </Link>
    </main>
  );
}
