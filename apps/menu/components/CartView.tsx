"use client";

import Link from "next/link";
import { calculateTax, formatCurrency, roundMoney } from "@brin/utils";
import { useCart } from "@/hooks/useCart";

export function CartView({ taxRatePercent }: { taxRatePercent: number }) {
  const { items, itemTotal, updateQuantity, removeItem, subtotal } = useCart();

  const tax = calculateTax(subtotal, taxRatePercent);
  const total = roundMoney(subtotal + tax);

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 text-center">
        <p>سلتك فاضية.</p>
        <Link href="/" className="mt-4 inline-block text-[var(--color-brand-primary)]">
          تصفّح المنيو
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">سلتي</h1>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.cartItemId} className="rounded-lg border p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{item.name}</p>
                {item.modifiers.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {item.modifiers.map((m) => m.name).join("، ")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.cartItemId)}
                className="text-sm text-red-600"
              >
                حذف
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                  className="h-7 w-7 rounded-full border"
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                  className="h-7 w-7 rounded-full border"
                >
                  +
                </button>
              </div>
              <span className="font-bold">{formatCurrency(itemTotal(item))}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-1 border-t pt-4">
        <div className="flex justify-between">
          <span>المجموع الفرعي</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>الضريبة ({taxRatePercent}%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>الإجمالي</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <Link
        href="/checkout"
        className="mt-4 block rounded bg-[var(--color-brand-primary)] px-4 py-3 text-center text-white"
      >
        متابعة الطلب
      </Link>
    </main>
  );
}
